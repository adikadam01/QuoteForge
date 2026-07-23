// import { useState } from 'react';
// import ClientForm from '@/components/clients/ClientForm';
// import { useClientOptions } from '@/components/clients/useClientOptions';
// import { Plus, Edit2, Trash2, Users, Search, Building, Mail } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { useApp } from '@/contexts/AppContext';
// import { useToast } from '@/hooks/use-toast';
// import type { Client } from '@/lib/types';



// export default function Clients() {
//   const { clients, addClient, updateClient, deleteClient, quotations, currency } = useApp();
//   // console.log("CLIENTS PAGE RECEIVED =", clients);
//   const clientOptions = useClientOptions();
//   const { toast } = useToast();
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editingClient, setEditingClient] = useState<Client | null>(null);

//   // Filters (optional)
//   const [sortBy, setSortBy] = useState<'default' | 'revenue_desc' | 'recently_active' | 'quotations_desc'>('default');
//   const [filterIndustry, setFilterIndustry] = useState<string>('all');
//   const [filterBusinessType, setFilterBusinessType] = useState<string>('all');
//   const [filterServiceId, setFilterServiceId] = useState<string>('all');

//   const getClientQuotations = (clientId: string) => {
//     return quotations.filter(q => q.client_id === clientId);
//   };

//   const getClientMetrics = (clientId: string) => {
//     const qs = getClientQuotations(clientId);
//     const quotationCount = qs.length;
//     const totalRevenue = qs.reduce((sum, q) => sum + Number(q.total || 0), 0);
//     const mostRecent = qs
//       .map((q) => new Date(q.updated_at || q.created_at).getTime())
//       .filter((t) => Number.isFinite(t))
//       .sort((a, b) => b - a)[0];

//     const serviceIds = new Set<string>();
//     qs.forEach((q) => {
//       (q.services || []).forEach((s) => {
//         if (s.service_id) serviceIds.add(String(s.service_id));
//       });
//       (q.service_blocks || []).forEach((b) => {
//         if (b.service_id) serviceIds.add(String(b.service_id));
//       });
//     });
//     return { quotationCount, totalRevenue, serviceIds, mostRecent: mostRecent || 0 };
//   };

//   const baseSearchFiltered = clients.filter(client =>
//     client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     (client.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
//     (client.email || '').toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const filteredClients = baseSearchFiltered
//     .filter((client) => {
//       if (filterIndustry !== 'all' && (client.industry || '').trim() !== filterIndustry.trim()) return false;
//       if (filterBusinessType !== 'all' && (client.business_type || '').trim() !== filterBusinessType.trim()) return false;
//       if (filterServiceId !== 'all') {
//         const metrics = getClientMetrics(client.id);
//         if (!metrics.serviceIds.has(filterServiceId)) return false;
//       }
//       return true;
//     })
//     .sort((a, b) => {
//       if (sortBy === 'default') return 0;
//       const am = getClientMetrics(a.id);
//       const bm = getClientMetrics(b.id);
//       if (sortBy === 'revenue_desc') return bm.totalRevenue - am.totalRevenue;
//       if (sortBy === 'recently_active') return bm.mostRecent - am.mostRecent;
//       if (sortBy === 'quotations_desc') return bm.quotationCount - am.quotationCount;
//       return 0;
//     });

//   const handleOpenDialog = (client?: Client) => {
//     if (client) {
//       setEditingClient(client);
//     } else {
//       setEditingClient(null);
//     }
//     setIsDialogOpen(true);
//   };

//   const handleSubmitClient = async (payload: import('@/components/clients/ClientForm').ClientFormSubmitPayload) => {
//     const emailLower = payload.email.trim().toLowerCase();
//     const existingClient = emailLower
//       ? clients.find((c) => (c.email || "").toLowerCase() === emailLower && c.id !== editingClient?.id)
//       : undefined;
//     if (existingClient) {
//       toast({
//         title: 'Duplicate email',
//         description: 'A client with this email already exists.',
//         variant: 'destructive',
//       });
//       return;
//     }

//     try {
//       if (editingClient) {
//         await updateClient({
//           ...editingClient,
//           name: payload.name,
//           email: payload.email,
//           business_name: payload.business_name,
//           business_type: payload.business_type,
//           custom_business_type: payload.custom_business_type,
//           industry: payload.industry,
//           custom_industry: payload.custom_industry,
//           phone: payload.phone,
//           whatsapp: payload.whatsapp,
//           location: payload.location,
//           address: payload.address,
//         });
//         toast({ title: 'Client updated', description: 'Client information has been updated.' });
//       } else {
//         await addClient({
//           name: payload.name,
//           email: payload.email,
//           business_name: payload.business_name,
//           size: 'small',
//           business_type: payload.business_type,
//           custom_business_type: payload.custom_business_type,
//           industry: payload.industry,
//           custom_industry: payload.custom_industry,
//           location: payload.location,
//           address: payload.address,
//           notes: null,
//           phone: payload.phone,
//           whatsapp: payload.whatsapp,
//         });
//         toast({ title: 'Client added', description: 'New client has been added successfully.' });
//       }

//       setIsDialogOpen(false);
//       setEditingClient(null);
//     } catch (err) {
//       if (import.meta.env.DEV) console.error('Client mutation failed', err);
//       toast({ title: 'Error', description: 'Failed to save client', variant: 'destructive' });
//     }
//   };

//   const handleDelete = async (id: string) => {
//     try {
//       await deleteClient(id);
//       toast({ title: "Client deleted", description: "Client has been removed." });
//     } catch (err) {
//       if (import.meta.env.DEV) console.error('Client delete failed', err);
//       toast({ title: 'Error', description: 'Failed to delete client', variant: 'destructive' });
//     }
//   };

//   const industries = (clientOptions.industries || []).map((s) => s.trim()).filter(Boolean);
//   const businessTypes = (clientOptions.businessTypes || []).map((s) => s.trim()).filter(Boolean);

//   const serviceOptions = Array.from(new Map(
//     quotations
//       .flatMap((q) => (q.services || []).map((s) => ({ id: s.service_id ? String(s.service_id) : '', name: s.service_name })))
//       .filter((s) => s.id)
//       .map((s) => [s.id, s] as const),
//   ).values());

//   return (
//     <div className="space-y-8 animate-fade-in">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shrink-0 shadow-sm">
//             <Users className="w-6 h-6 text-white" strokeWidth={2} />
//           </div>
//           <div>
//             <h1 className="text-3xl font-heading font-bold text-foreground">Clients</h1>
//             <p className="text-muted-foreground mt-1">Manage your client database.</p>
//           </div>
//         </div>
//         <Button onClick={() => handleOpenDialog()} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
//           <Plus className="w-4 h-4" /> Add Client
//         </Button>
//       </div>

//       {/* Toolbar: Search + Filters */}
//       <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
//         <div className="relative w-full md:max-w-xs">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//           <Input
//             placeholder="Search clients..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="pl-9 bg-background/50"
//           />
//         </div>

//         <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
//           <Select value={filterServiceId} onValueChange={setFilterServiceId}>
//             <SelectTrigger className="w-[140px] h-9 text-xs">
//               <SelectValue placeholder="Service" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Services</SelectItem>
//               {serviceOptions.map((s) => (
//                 <SelectItem key={s.id} value={s.id}>
//                   {s.name || s.id}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>

//           <Select value={filterIndustry} onValueChange={setFilterIndustry}>
//             <SelectTrigger className="w-[140px] h-9 text-xs">
//               <SelectValue placeholder="Industry" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Industries</SelectItem>
//               {industries.map((ind) => (
//                 <SelectItem key={ind} value={ind}>
//                   {ind}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>

//           <Select value={filterBusinessType} onValueChange={setFilterBusinessType}>
//             <SelectTrigger className="w-[140px] h-9 text-xs">
//               <SelectValue placeholder="Business Type" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Types</SelectItem>
//               {businessTypes.map((bt) => (
//                 <SelectItem key={bt} value={bt}>
//                   {bt}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>

//           <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
//             <SelectTrigger className="w-[140px] h-9 text-xs ml-auto md:ml-2">
//               <SelectValue placeholder="Sort" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="default">Default</SelectItem>
//               <SelectItem value="revenue_desc">Revenue: High to Low</SelectItem>
//               <SelectItem value="recently_active">Recently Active</SelectItem>
//               <SelectItem value="quotations_desc">Most Quotations</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       {/* Clients Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {filteredClients.map((client) => {
//           const clientQuotations = getClientQuotations(client.id);
//           const totalValue = clientQuotations.reduce((sum, q) => sum + q.total, 0);

//           return (
//             <Card key={client.id} className="border-border/40 shadow-sm hover:shadow-md transition-all group">
//               <CardHeader className="pb-4 pt-5 px-5">
//                 <div className="flex items-start justify-between">
//                   <div className="flex items-center gap-4">
//                     <div className="w-12 h-12 rounded-full bg-primary/5 text-primary flex items-center justify-center text-lg font-bold">
//                       {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
//                     </div>
//                     <div>
//                       <CardTitle className="text-base font-semibold">{client.name}</CardTitle>
//                       {client.business_name && (
//                         <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
//                           <Building className="w-3 h-3 opacity-70" />
//                           {client.business_name}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(client)}>
//                       <Edit2 className="w-3.5 h-3.5" />
//                     </Button>
//                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(client.id)}>
//                       <Trash2 className="w-3.5 h-3.5 text-destructive/80" />
//                     </Button>
//                   </div>
//                 </div>
//               </CardHeader>
//               <CardContent className="pb-5 px-5">
//                 <div className="space-y-4">
//                   {(client.email || client.business_type || client.industry) && (
//                     <div className="space-y-2.5">
//                       {client.email && (
//                         <div className="flex items-center gap-2 text-xs text-muted-foreground">
//                           <Mail className="w-3.5 h-3.5 opacity-70" />
//                           {client.email}
//                         </div>
//                       )}
//                       <div className="flex flex-wrap gap-2">
//                         {client.business_type ? <Badge variant="secondary" className="font-normal text-xs bg-secondary/50 hover:bg-secondary/70">{client.business_type}</Badge> : null}
//                         {client.industry ? <Badge variant="outline" className="font-normal text-xs">{client.industry}</Badge> : null}
//                       </div>
//                     </div>
//                   )}

//                   <div className="pt-4 border-t border-border/40 flex items-center justify-between">
//                     <div>
//                       <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Quotations</p>
//                       <p className="text-sm font-semibold">{clientQuotations.length}</p>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Total Value</p>
//                       <p className="text-sm font-semibold text-primary">
//                         {(currency === 'INR' ? '₹' : '$')}{totalValue.toLocaleString()}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           );
//         })}
//       </div>

//       {filteredClients.length === 0 && (
//         <div className="text-center py-16">
//           <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
//             <Users className="w-8 h-8 text-muted-foreground" />
//           </div>
//           <p className="text-muted-foreground mb-4">
//             {searchQuery ? 'No clients match your search' : 'No clients yet'}
//           </p>
//           <Button onClick={() => handleOpenDialog()} variant="outline" className="gap-2">
//             <Plus className="w-4 h-4" /> Add your first client
//           </Button>
//         </div>
//       )}

//       {/* Add/Edit Dialog */}
//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
//           <DialogHeader className="px-6 pt-6 pb-4 border-b bg-background sticky top-0 z-20">
//             <DialogTitle className="font-heading">
//               {editingClient ? 'Edit Client' : 'Add New Client'}
//             </DialogTitle>
//             <DialogDescription>
//               {editingClient ? 'Update client information.' : 'Add a new client to your database.'}
//             </DialogDescription>
//           </DialogHeader>

//           <div className="max-h-[70vh] overflow-y-auto scrollbar-modern px-6 py-5">
//             <ClientForm
//               key={`${clientOptions.businessTypes.join("|")}__${clientOptions.industries.join("|")}`}
//               options={clientOptions}
//               initialValues={
//                 editingClient
//                   ? {
//                     business_name: editingClient.business_name || '',
//                     name: editingClient.name,
//                     business_type: editingClient.business_type || "",
//                     custom_business_type: editingClient.custom_business_type || null,
//                     industry: editingClient.industry || "",
//                     custom_industry: editingClient.custom_industry || null,
//                     email: editingClient.email || '',
//                     phone: editingClient.phone,
//                     whatsapp: editingClient.whatsapp,
//                     whatsapp_same_as_phone:
//                       Boolean(
//                         editingClient.whatsapp &&
//                         editingClient.phone &&
//                         editingClient.whatsapp === editingClient.phone
//                       ),
//                     location: editingClient.location,
//                   }
//                   : null
//               }
//               submitLabel={editingClient ? "Update Client" : "Create Client"}
//               onCancel={() => setIsDialogOpen(false)}
//               onSubmit={handleSubmitClient}
//             />
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

import { useState } from 'react';
import ClientForm from '@/components/clients/ClientForm';
import { useClientOptions } from '@/components/clients/useClientOptions';
import { Plus, Edit2, Trash2, Users, Search, Building, Mail, Eye, Phone, MessageCircle, MapPin, Tag, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/lib/types';



export default function Clients() {
  const { clients, addClient, updateClient, deleteClient, quotations, currency } = useApp();
  // console.log("CLIENTS PAGE RECEIVED =", clients);
  const clientOptions = useClientOptions();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Filters (optional)
  const [sortBy, setSortBy] = useState<'default' | 'revenue_desc' | 'recently_active' | 'quotations_desc'>('default');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');
  const [filterBusinessType, setFilterBusinessType] = useState<string>('all');
  const [filterServiceId, setFilterServiceId] = useState<string>('all');

  const getClientQuotations = (clientId: string) => {
    return quotations.filter(q => q.client_id === clientId);
  };

  const getClientMetrics = (clientId: string) => {
    const qs = getClientQuotations(clientId);
    const quotationCount = qs.length;
    const totalRevenue = qs.reduce((sum, q) => sum + Number(q.total || 0), 0);
    const mostRecent = qs
      .map((q) => new Date(q.updated_at || q.created_at).getTime())
      .filter((t) => Number.isFinite(t))
      .sort((a, b) => b - a)[0];

    const serviceIds = new Set<string>();
    qs.forEach((q) => {
      (q.services || []).forEach((s) => {
        if (s.service_id) serviceIds.add(String(s.service_id));
      });
      (q.service_blocks || []).forEach((b) => {
        if (b.service_id) serviceIds.add(String(b.service_id));
      });
    });
    return { quotationCount, totalRevenue, serviceIds, mostRecent: mostRecent || 0 };
  };

  const baseSearchFiltered = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClients = baseSearchFiltered
    .filter((client) => {
      if (filterIndustry !== 'all' && (client.industry || '').trim() !== filterIndustry.trim()) return false;
      if (filterBusinessType !== 'all' && (client.business_type || '').trim() !== filterBusinessType.trim()) return false;
      if (filterServiceId !== 'all') {
        const metrics = getClientMetrics(client.id);
        if (!metrics.serviceIds.has(filterServiceId)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'default') return 0;
      const am = getClientMetrics(a.id);
      const bm = getClientMetrics(b.id);
      if (sortBy === 'revenue_desc') return bm.totalRevenue - am.totalRevenue;
      if (sortBy === 'recently_active') return bm.mostRecent - am.mostRecent;
      if (sortBy === 'quotations_desc') return bm.quotationCount - am.quotationCount;
      return 0;
    });

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
    } else {
      setEditingClient(null);
    }
    setIsDialogOpen(true);
  };

  const handleOpenViewDialog = (client: Client) => {
    setViewingClient(client);
    setIsViewDialogOpen(true);
  };

  const handleSubmitClient = async (payload: import('@/components/clients/ClientForm').ClientFormSubmitPayload) => {
    const emailLower = payload.email.trim().toLowerCase();
    const existingClient = emailLower
      ? clients.find((c) => (c.email || "").toLowerCase() === emailLower && c.id !== editingClient?.id)
      : undefined;
    if (existingClient) {
      toast({
        title: 'Duplicate email',
        description: 'A client with this email already exists.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingClient) {
        await updateClient({
          ...editingClient,
          name: payload.name,
          email: payload.email,
          business_name: payload.business_name,
          business_type: payload.business_type,
          custom_business_type: payload.custom_business_type,
          industry: payload.industry,
          custom_industry: payload.custom_industry,
          phone: payload.phone,
          whatsapp: payload.whatsapp,
          location: payload.location,
          address: payload.address,
        });
        toast({ title: 'Client updated', description: 'Client information has been updated.' });
      } else {
        await addClient({
          name: payload.name,
          email: payload.email,
          business_name: payload.business_name,
          size: 'small',
          business_type: payload.business_type,
          custom_business_type: payload.custom_business_type,
          industry: payload.industry,
          custom_industry: payload.custom_industry,
          location: payload.location,
          address: payload.address,
          notes: null,
          phone: payload.phone,
          whatsapp: payload.whatsapp,
        });
        toast({ title: 'Client added', description: 'New client has been added successfully.' });
      }

      setIsDialogOpen(false);
      setEditingClient(null);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Client mutation failed', err);
      toast({ title: 'Error', description: 'Failed to save client', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteClient(id);
      toast({ title: "Client deleted", description: "Client has been removed." });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Client delete failed', err);
      toast({ title: 'Error', description: 'Failed to delete client', variant: 'destructive' });
    }
  };

  const industries = (clientOptions.industries || []).map((s) => s.trim()).filter(Boolean);
  const businessTypes = (clientOptions.businessTypes || []).map((s) => s.trim()).filter(Boolean);

  const serviceOptions = Array.from(new Map(
    quotations
      .flatMap((q) => (q.services || []).map((s) => ({ id: s.service_id ? String(s.service_id) : '', name: s.service_name })))
      .filter((s) => s.id)
      .map((s) => [s.id, s] as const),
  ).values());

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center shrink-0 shadow-md shadow-black/10 ring-1 ring-black/5">
            <Users className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Clients</h1>
            <p className="text-muted-foreground mt-1">
              {clients.length} {clients.length === 1 ? 'client' : 'clients'} in your database
            </p>
          </div>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-black text-white hover:bg-black/90 gap-2 rounded-xl shadow-sm hover:shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Client
        </Button>
      </div>

      {/* Toolbar: Search + Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between rounded-2xl border border-border/60 bg-secondary/20 p-3">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background rounded-xl border-border/70 focus-visible:ring-black/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Select value={filterServiceId} onValueChange={setFilterServiceId}>
            <SelectTrigger className="w-[140px] h-9 text-xs rounded-lg bg-background border-border/70">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {serviceOptions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name || s.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterIndustry} onValueChange={setFilterIndustry}>
            <SelectTrigger className="w-[140px] h-9 text-xs rounded-lg bg-background border-border/70">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((ind) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterBusinessType} onValueChange={setFilterBusinessType}>
            <SelectTrigger className="w-[140px] h-9 text-xs rounded-lg bg-background border-border/70">
              <SelectValue placeholder="Business Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {businessTypes.map((bt) => (
                <SelectItem key={bt} value={bt}>
                  {bt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[140px] h-9 text-xs rounded-lg bg-background border-border/70 ml-auto md:ml-2">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="revenue_desc">Revenue: High to Low</SelectItem>
              <SelectItem value="recently_active">Recently Active</SelectItem>
              <SelectItem value="quotations_desc">Most Quotations</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const clientQuotations = getClientQuotations(client.id);
          const totalValue = clientQuotations.reduce((sum, q) => sum + q.total, 0);

          return (
            <Card
              key={client.id}
              className="border border-border/60 hover:border-black/20 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden"
            >
              <CardHeader className="pb-4 pt-5 px-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center text-base font-heading font-bold shrink-0 group-hover:scale-105 transition-transform">
                      {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base font-semibold truncate">{client.name}</CardTitle>
                      {client.business_name && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 truncate">
                          <Building className="w-3 h-3 opacity-70 shrink-0" />
                          <span className="truncate">{client.business_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-black hover:text-white"
                      onClick={() => handleOpenViewDialog(client)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-black hover:text-white"
                      onClick={() => handleOpenDialog(client)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDelete(client.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive/80 group-hover:text-current" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-5 px-5">
                <div className="space-y-4">
                  {(client.email || client.business_type || client.industry) && (
                    <div className="space-y-2.5">
                      {client.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="w-3.5 h-3.5 opacity-70 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {client.business_type ? (
                          <Badge variant="secondary" className="font-normal text-xs bg-secondary/60 hover:bg-secondary/80 rounded-full px-2.5">
                            {client.business_type}
                          </Badge>
                        ) : null}
                        {client.industry ? (
                          <Badge variant="outline" className="font-normal text-xs rounded-full px-2.5 border-border/70">
                            {client.industry}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Quotations</p>
                      <p className="text-lg font-heading font-bold text-foreground tabular-nums">{clientQuotations.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Total Value</p>
                      <p className="text-lg font-heading font-bold text-foreground tabular-nums">
                        {(currency === 'INR' ? '₹' : '$')}{totalValue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-20 rounded-2xl border border-dashed border-border/70 bg-secondary/20">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'No clients match your search' : 'No clients yet'}
          </p>
          <Button onClick={() => handleOpenDialog()} variant="outline" className="gap-2 rounded-xl hover:bg-black hover:text-white transition-colors">
            <Plus className="w-4 h-4" /> Add your first client
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60 bg-background sticky top-0 z-20">
            <DialogTitle className="font-heading flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-black" />
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </DialogTitle>
            <DialogDescription>
              {editingClient ? 'Update client information.' : 'Add a new client to your database.'}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto scrollbar-modern px-6 py-5">
            <ClientForm
              key={`${clientOptions.businessTypes.join("|")}__${clientOptions.industries.join("|")}`}
              options={clientOptions}
              initialValues={
                editingClient
                  ? {
                    business_name: editingClient.business_name || '',
                    name: editingClient.name,
                    business_type: editingClient.business_type || "",
                    custom_business_type: editingClient.custom_business_type || null,
                    industry: editingClient.industry || "",
                    custom_industry: editingClient.custom_industry || null,
                    email: editingClient.email || '',
                    phone: editingClient.phone,
                    whatsapp: editingClient.whatsapp,
                    whatsapp_same_as_phone:
                      Boolean(
                        editingClient.whatsapp &&
                        editingClient.phone &&
                        editingClient.whatsapp === editingClient.phone
                      ),
                    location: editingClient.location,
                  }
                  : null
              }
              submitLabel={editingClient ? "Update Client" : "Create Client"}
              onCancel={() => setIsDialogOpen(false)}
              onSubmit={handleSubmitClient}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* View Client Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-modern rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {viewingClient && (
                <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center text-base font-heading font-bold shrink-0">
                  {viewingClient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              )}
              <div>
                <DialogTitle className="font-heading text-xl">
                  {viewingClient?.name || 'Client Profile'}
                </DialogTitle>
                {viewingClient?.business_name && (
                  <DialogDescription className="mt-0.5">
                    {viewingClient.business_name}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          {viewingClient && (
            <div className="space-y-6 py-2">
              {(viewingClient.business_type || viewingClient.industry) && (
                <div className="flex flex-wrap gap-2">
                  {viewingClient.business_type && (
                    <Badge variant="secondary" className="font-normal rounded-full px-3">
                      <Tag className="w-3 h-3 mr-1.5" />
                      {viewingClient.business_type}
                    </Badge>
                  )}
                  {viewingClient.industry && (
                    <Badge variant="outline" className="font-normal rounded-full px-3 border-border/70">
                      {viewingClient.industry}
                    </Badge>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewingClient.email && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                      <p className="text-sm font-medium truncate">{viewingClient.email}</p>
                    </div>
                  </div>
                )}
                {viewingClient.phone && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                      <p className="text-sm font-medium truncate">{viewingClient.phone}</p>
                    </div>
                  </div>
                )}
                {viewingClient.whatsapp && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30">
                    <MessageCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">WhatsApp</p>
                      <p className="text-sm font-medium truncate">{viewingClient.whatsapp}</p>
                    </div>
                  </div>
                )}
                {(viewingClient.location || viewingClient.address) && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
                      <p className="text-sm font-medium truncate">{viewingClient.address || viewingClient.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {viewingClient.notes && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Notes</p>
                  </div>
                  <div className="rounded-xl border border-border/60 p-3 bg-secondary/20">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{viewingClient.notes}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Quotations</p>
                  <p className="text-lg font-heading font-bold text-foreground tabular-nums">
                    {getClientQuotations(viewingClient.id).length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Total Value</p>
                  <p className="text-lg font-heading font-bold text-foreground tabular-nums">
                    {(currency === 'INR' ? '₹' : '$')}
                    {getClientQuotations(viewingClient.id).reduce((sum, q) => sum + q.total, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Added{' '}
                  {viewingClient.created_at
                    ? new Date(viewingClient.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                    : '—'}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleOpenDialog(viewingClient);
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Edit Client
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}