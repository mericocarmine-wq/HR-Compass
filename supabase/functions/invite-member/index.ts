import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { company_id, email, role, department } = await req.json();

    if (!company_id || !email || !role) {
      return new Response(
        JSON.stringify({ error: "Faltan campos obligatorios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["empleado", "admin", "manager"].includes(role)) {
      return new Response(
        JSON.stringify({ error: "Rol no válido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use anon key from request header for caller context (preserves auth.uid())
    const anonKey = req.headers.get("apikey") || serviceRoleKey;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: canManage } = await callerClient.rpc("can_manage_company", {
      _company_id: company_id,
    });

    if (!canManage) {
      return new Response(
        JSON.stringify({ error: "No tienes permisos para invitar empleados" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client for user creation
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const trimmedEmail = email.trim().toLowerCase();

    // Check if member already exists in company
    const { data: existing } = await adminClient
      .from("company_members")
      .select("id")
      .eq("company_id", company_id)
      .eq("email", trimmedEmail)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ error: "Ya existe un miembro con ese email en la empresa" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Supabase sends a single-use link; no shared/default passwords are created.
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.inviteUserByEmail(trimmedEmail, {
        data: { full_name: trimmedEmail.split("@")[0] },
      });

    if (createError || !newUser?.user) {
      return new Response(
        JSON.stringify({ error: createError?.message || "Error creando usuario" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = newUser.user.id;

    // Insert company member as active
    const { data: member, error: insertError } = await adminClient
      .from("company_members")
      .insert({
        company_id,
        user_id: userId,
        email: trimmedEmail,
        role,
        department: department || null,
        status: "active",
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ member }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
