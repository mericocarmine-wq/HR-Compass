import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { store } from '@/lib/store';

interface Company {
  id: string;
  name: string;
  sector: string | null;
  logo_url: string | null;
}

interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string | null;
  email: string;
  role: string;
  department: string | null;
  status: string;
  invited_at: string;
  joined_at: string | null;
  full_name: string | null;
}

interface CompanyContextType {
  company: Company | null;
  members: CompanyMember[];
  membership: CompanyMember | null;
  loading: boolean;
  refetchMembers: () => Promise<void>;
  setCompany: (c: Company) => void;
}

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  members: [],
  membership: null,
  loading: true,
  refetchMembers: async () => {},
  setCompany: () => {},
});

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [membership, setMembership] = useState<CompanyMember | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async (companyId: string) => {
    const { data, error } = await supabase
      .from('company_members')
      .select('*')
      .eq('company_id', companyId)
      .order('invited_at', { ascending: true });
    if (error) throw error;
    setMembers(data as CompanyMember[]);
  }, []);

  const fetchCompany = useCallback(async () => {
    if (!user) {
      setCompany(null);
      setMembership(null);
      setMembers([]);
      store.setTenant(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: memberRows, error: membershipError } = await supabase
      .from('company_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1);

    if (membershipError) {
      setLoading(false);
      throw membershipError;
    }

    if (memberRows && memberRows.length > 0) {
      const mem = memberRows[0] as CompanyMember;
      setMembership(mem);
      store.setTenant(mem.company_id);

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', mem.company_id)
        .single();

      if (companyError) {
        setLoading(false);
        throw companyError;
      }
      setCompany(companyData as Company);
      await fetchMembers(mem.company_id);
    } else {
      setCompany(null);
      setMembership(null);
      setMembers([]);
      store.setTenant(null);
    }
    setLoading(false);
  }, [fetchMembers, user]);

  const refetchMembers = async () => {
    if (company) await fetchMembers(company.id);
  };

  useEffect(() => {
    void fetchCompany();
  }, [fetchCompany]);

  return (
    <CompanyContext.Provider value={{ company, members, membership, loading, refetchMembers, setCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
