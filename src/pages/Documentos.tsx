import { useState } from 'react';
import { FileText, Upload, FolderOpen, File, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { store } from '@/lib/store';
import { Documento } from '@/types/hr';

const categorias = ['contratos', 'nominas', 'certificados', 'otros'] as const;

export default function Documentos() {
  const [docs, setDocs] = useState(store.getDocumentos());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: '', categoria: 'contratos' as Documento['categoria'] });

  const upload = () => {
    if (!form.nombre) return;
    const nuevo: Documento = {
      id: crypto.randomUUID(), nombre: form.nombre, categoria: form.categoria,
      fechaSubida: new Date().toISOString().split('T')[0], tamaño: '245 KB', tipo: 'PDF',
    };
    const updated = [...docs, nuevo];
    setDocs(updated); store.setDocumentos(updated); setOpen(false);
    setForm({ nombre: '', categoria: 'contratos' });
  };

  const remove = (id: string) => {
    const updated = docs.filter(d => d.id !== id);
    setDocs(updated); store.setDocumentos(updated);
  };

  const catLabel: Record<string, string> = { contratos: 'Contratos', nominas: 'Nóminas', certificados: 'Certificados', otros: 'Otros' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">Repositorio centralizado de documentos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Upload className="h-4 w-4 mr-1" /> Subir documento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Subir documento</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Nombre del documento</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Contrato_Juan_2024.pdf" /></div>
              <div>
                <Label>Categoría</Label>
                <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v as Documento['categoria'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categorias.map(c => <SelectItem key={c} value={c}>{catLabel[c]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Arrastra archivos aquí o haz clic para seleccionar</p>
                <p className="text-xs mt-1">PDF, DOC, XLS hasta 10MB</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={upload}>Subir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          {categorias.map(c => <TabsTrigger key={c} value={c}>{catLabel[c]}</TabsTrigger>)}
        </TabsList>

        {['todos', ...categorias].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="pt-6">
                {(() => {
                  const filtered = tab === 'todos' ? docs : docs.filter(d => d.categoria === tab);
                  if (filtered.length === 0) return (
                    <div className="flex flex-col items-center py-12 text-muted-foreground">
                      <FolderOpen className="h-10 w-10 mb-2 opacity-30" />
                      <p className="text-sm">No hay documentos en esta categoría</p>
                    </div>
                  );
                  return (
                    <div className="space-y-2">
                      {filtered.map(d => (
                        <div key={d.id} className="flex items-center justify-between border rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <File className="h-8 w-8 text-primary" />
                            <div>
                              <p className="font-medium text-sm">{d.nombre}</p>
                              <p className="text-xs text-muted-foreground">{d.tamaño} · {d.fechaSubida}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{catLabel[d.categoria]}</Badge>
                            <Button variant="ghost" size="icon" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
