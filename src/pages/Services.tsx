// import { useEffect, useState } from 'react';
// import { Plus, Edit2, Trash2, Package, Search, Eye } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Badge } from '@/components/ui/badge';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { useApp } from '@/contexts/AppContext';
// import { useToast } from '@/hooks/use-toast';
// import { Service, PRICING_MODEL_LABELS, PricingModel } from '@/lib/types';
// import { RichEditor, RichTextDisplay } from '@/components/ui/RichText';

// type TimelineUnit = 'Days' | 'Weeks' | 'Months';

// const TIMELINE_UNIT_MAX: Record<TimelineUnit, number> = {
//   Days: 30,
//   Weeks: 20,
//   Months: 12,
// };

// function parseTimelineString(value: string): { unit: TimelineUnit; amount: number } {
//   const match = (value || '').trim().match(/^(\d+)\s*(day|days|week|weeks|month|months)$/i);
//   if (!match) return { unit: 'Weeks', amount: 1 };

//   const amount = Math.max(1, parseInt(match[1], 10) || 1);
//   const rawUnit = match[2].toLowerCase();

//   let unit: TimelineUnit = 'Weeks';
//   if (rawUnit.startsWith('day')) unit = 'Days';
//   else if (rawUnit.startsWith('week')) unit = 'Weeks';
//   else if (rawUnit.startsWith('month')) unit = 'Months';

//   return { unit, amount: Math.min(amount, TIMELINE_UNIT_MAX[unit]) };
// }

// function formatTimelineString(unit: TimelineUnit, amount: number): string {
//   const singular = unit.slice(0, -1);
//   return `${amount} ${amount === 1 ? singular : unit}`;
// }

// const DEFAULT_CATEGORY_SUBCATEGORY: Record<string, string[]> = {
//   Branding: [
//     "Logo Design",
//     "Brand Identity",
//     "Brand Guidelines",
//     "Business Profile",
//     "Company Branding"
//   ],

//   "Content Creation": [
//     "Social Media Content",
//     "Blog Writing",
//     "Copywriting",
//     "Content Calendar",
//     "Product Content"
//   ],

//   "Digital Marketing": [
//     "SEO",
//     "Google Ads",
//     "Meta Ads",
//     "Performance Marketing",
//     "Lead Generation"
//   ],

//   "Graphic Designing": [
//     "Poster Design",
//     "Brochure Design",
//     "Social Media Creatives",
//     "Packaging Design",
//     "Marketing Collateral"
//   ],

//   "Hosting & Website Maintenance": [
//     "Website Hosting",
//     "Website Maintenance",
//     "Website Security",
//     "Backup Management",
//     "Performance Optimization"
//   ],

//   Other: [
//     "Consulting",
//     "Training",
//     "Business Strategy",
//     "Technical Support"
//   ],

//   "Photoshoot & Video Production": [
//     "Corporate Shoot",
//     "Product Shoot",
//     "Event Coverage",
//     "Promotional Video",
//     "Drone Shoot"
//   ],

//   "Software Development": [
//     "Web Application",
//     "Mobile Application",
//     "CRM Development",
//     "ERP Development",
//     "Custom Software"
//   ],

//   "Startup Kit": [
//     "Startup Launch Package",
//     "Branding + Website",
//     "MVP Package",
//     "Investor Deck",
//     "Complete Startup Kit"
//   ],

//   "Video Editing": [
//     "Reels Editing",
//     "YouTube Editing",
//     "Corporate Video Editing",
//     "Motion Graphics",
//     "Advertisement Editing"
//   ],

//   "website development": [
//     "Business Website",
//     "Corporate Website",
//     "E-Commerce Website",
//     "Landing Page",
//     "Portfolio Website"
//   ]
// };



// interface LocalAddon {
//   id: string;
//   name: string;
//   price: number;
// }

// export default function Services() {
//   const { services, addService, updateService, deleteService, currency, serviceOptions } = useApp();
//   const { toast } = useToast();
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editingService, setEditingService] = useState<Service | null>(null);
//   const [viewingService, setViewingService] = useState<Service | null>(null);
//   const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
//   const firstCategory = Object.keys(DEFAULT_CATEGORY_SUBCATEGORY)[0] || '';
//   const [timelineUnit, setTimelineUnit] = useState<TimelineUnit>('Weeks');
//   const [timelineAmount, setTimelineAmount] = useState<number>(1);

//   const [formData, setFormData] = useState<{
//     name: string;
//     description: string;
//     category: string;
//     subcategory: string;
//     billing_type: 'one_time' | 'monthly' | 'milestone' | 'retainer';
//     base_price: number;
//     duration_months: number;
//     milestones: Array<{ label: string; amount: string }>;
//     addons: LocalAddon[];
//     scope_of_work: string;
//     deliverables: string;
//     timeline: string;
//     payment_terms: string;
//     service_terms: string;
//   }>({
//     name: '',
//     description: '',
//     category: firstCategory,
//     subcategory: DEFAULT_CATEGORY_SUBCATEGORY[firstCategory]?.[0] || '',
//     billing_type: 'one_time',
//     base_price: 0,
//     duration_months: 1,
//     milestones: [
//       { label: 'Milestone 1', amount: '' },
//       { label: 'Milestone 2', amount: '' },
//     ],
//     addons: [],
//     scope_of_work: '',
//     deliverables: '',
//     timeline: '',
//     payment_terms: '',
//     service_terms: '',
//   });

//   const filteredServices = services.filter(service =>
//     service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     (service.category || '').toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const handleOpenDialog = (service?: Service) => {
//     if (service) {
//       setEditingService(service);
//       const parsedTimeline = parseTimelineString(service.timeline || '');
//       setTimelineUnit(parsedTimeline.unit);
//       setTimelineAmount(parsedTimeline.amount);
//       setFormData({
//         name: service.name,
//         description: service.description || '',
//         category: service.category || firstCategory,
//         subcategory: (service.subcategory || '').trim() || (categoryMap[service.category || firstCategory]?.[0] || ''),
//         billing_type:
//           service.billing_type === 'monthly'
//             ? 'monthly'
//             : service.billing_type === 'milestone'
//               ? 'milestone'
//               : service.billing_type === 'retainer'
//                 ? 'retainer'
//                 : 'one_time',
//         base_price: service.base_price,
//         duration_months: typeof service.duration_months === 'number' && Number.isFinite(service.duration_months) ? service.duration_months : 1,
//         milestones: (service.milestone_template || []).map((m) => ({ label: m.label, amount: String(m.amount) })).length
//           ? (service.milestone_template || []).map((m) => ({ label: m.label, amount: String(m.amount) }))
//           : [
//             { label: 'Milestone 1', amount: '' },
//             { label: 'Milestone 2', amount: '' },
//           ],
//         addons: (service.addons || []).map(a => ({ id: a.id, name: a.name, price: a.price })),
//         scope_of_work: service.scope_of_work || '',
//         deliverables: service.deliverables || '',
//         timeline: service.timeline || '',
//         payment_terms: service.payment_terms || '',
//         service_terms: service.service_terms || '',
//       });
//     } else {
//       setEditingService(null);
//       setTimelineUnit('Weeks');
//       setTimelineAmount(1);
//       const firstCategory = Object.keys(DEFAULT_CATEGORY_SUBCATEGORY)[0] || '';

//       setFormData({
//         name: '',
//         description: '',
//         category: firstCategory,
//         subcategory: DEFAULT_CATEGORY_SUBCATEGORY[firstCategory]?.[0] || '',
//         billing_type: 'one_time',
//         base_price: 0,
//         duration_months: 1,
//         milestones: [
//           { label: 'Milestone 1', amount: '' },
//           { label: 'Milestone 2', amount: '' },
//         ],
//         addons: [],
//         scope_of_work: '',
//         deliverables: '',
//         timeline: '',
//         payment_terms: '',
//         service_terms: '',
//       });
//     }
//     setIsDialogOpen(true);
//   };

//   const handleSave = async () => {
//     if (!formData.name || !formData.description || !formData.scope_of_work.trim()) {
//       toast({
//         title: "Missing fields",
//         description: "Please fill in all required fields.",
//         variant: "destructive",
//       });
//       return;
//     }

//     const serviceData = {
//       name: formData.name,
//       description: formData.description,
//       category: formData.category,
//       subcategory: formData.subcategory || null,
//       billing_type: formData.billing_type,
//       duration_months:
//         formData.billing_type === 'monthly' || formData.billing_type === 'retainer'
//           ? Math.max(1, Number(formData.duration_months || 1))
//           : null,
//       milestone_template:
//         formData.billing_type === 'milestone'
//           ? (formData.milestones || [])
//             .map((m) => ({ label: (m.label || '').trim() || 'Milestone', amount: Number(m.amount || 0) }))
//             .filter((m) => m.amount > 0)
//           : null,
//       // For monthly/retainer: store monthly amount in base_price
//       // For one-time: store total price in base_price
//       // For milestone: base_price is informational only
//       base_price: Number(formData.base_price || 0),

//       // Legacy fields (do not remove): keep a safe mapping so older screens don't crash
//       pricing_model: (formData.billing_type === 'monthly' || formData.billing_type === 'retainer' ? 'monthly' : formData.billing_type === 'milestone' ? 'package' : 'fixed') as PricingModel,

//       is_active: true,
//       scope_of_work: formData.scope_of_work,
//       deliverables: formData.deliverables || null,
//       timeline: formData.timeline || null,
//       payment_terms: formData.payment_terms || null,
//       service_terms: formData.service_terms || null,
//       addons: formData.addons.map(a => ({
//         id: a.id,
//         service_id: editingService?.id || '',
//         name: a.name,
//         price: a.price,
//       })),
//     };

//     try {
//       if (editingService) {
//         await updateService({ ...editingService, ...serviceData });
//         toast({ title: "Service updated", description: "Service has been updated successfully." });
//       } else {
//         await addService(serviceData);
//         toast({ title: "Service added", description: "New service has been added to your catalog." });
//       }
//       setIsDialogOpen(false);
//     } catch (err) {
//       if (import.meta.env.DEV) console.error('Service mutation failed', err);
//       toast({ title: 'Error', description: 'Failed to save service', variant: 'destructive' });
//     }
//   };

//   const handleDelete = async (id: string) => {
//     try {
//       await deleteService(id);
//       toast({ title: "Service deleted", description: "Service has been removed from your catalog." });
//     } catch (err) {
//       if (import.meta.env.DEV) console.error('Service delete failed', err);
//       toast({ title: 'Error', description: 'Failed to delete service', variant: 'destructive' });
//     }
//   };

//   const handleAddAddOn = () => {
//     setFormData(prev => ({
//       ...prev,
//       addons: [...prev.addons, { id: Date.now().toString(), name: '', price: 0 }],
//     }));
//   };

//   const handleUpdateAddOn = (index: number, field: keyof LocalAddon, value: string | number) => {
//     setFormData(prev => ({
//       ...prev,
//       addons: prev.addons.map((addon, i) =>
//         i === index ? { ...addon, [field]: value } : addon
//       ),
//     }));
//   };

//   const handleRemoveAddOn = (index: number) => {
//     setFormData(prev => ({
//       ...prev,
//       addons: prev.addons.filter((_, i) => i !== index),
//     }));
//   };

//   const updateTimeline = (unit: TimelineUnit, amount: number) => {
//     const clamped = Math.min(Math.max(1, amount), TIMELINE_UNIT_MAX[unit]);
//     setTimelineUnit(unit);
//     setTimelineAmount(clamped);
//     setFormData(prev => ({ ...prev, timeline: formatTimelineString(unit, clamped) }));
//   };

//   const categoryMap = (serviceOptions.service_categories && Object.keys(serviceOptions.service_categories).length > 0)
//     ? serviceOptions.service_categories
//     : DEFAULT_CATEGORY_SUBCATEGORY;

//   const mainCategories = Object.keys(categoryMap);

//   // If current category no longer exists (removed in Settings), fall back safely.
//   const safeCategory = categoryMap[formData.category]
//     ? formData.category
//     : (mainCategories[0] || firstCategory);

//   const subcategories = categoryMap[safeCategory] || [];

//   // Keep the form state in sync with safeCategory so dropdown stays selectable.
//   useEffect(() => {
//     if (safeCategory !== formData.category) {
//       setFormData((p) => ({ ...p, category: safeCategory, subcategory: (categoryMap[safeCategory]?.[0] || '') }));
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [safeCategory]);

//   const computedTotal =
//     formData.billing_type === 'monthly' || formData.billing_type === 'retainer'
//       ? (Number(formData.base_price || 0) * Math.max(1, Number(formData.duration_months || 1)))
//       : formData.billing_type === 'milestone'
//         ? (formData.milestones || []).reduce((sum, m) => sum + (Number(m.amount || 0) || 0), 0)
//         : Number(formData.base_price || 0);

//   return (
//     <div className="space-y-8 animate-fade-in">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-heading font-bold text-foreground">Services</h1>
//           <p className="text-muted-foreground mt-1">Manage your service catalog and pricing.</p>
//         </div>
//         <Button
//           onClick={() => handleOpenDialog()}
//           className="bg-[#111111] text-white hover:bg-black/80 gap-2"
//         >
//           <Plus className="w-4 h-4" />
//           Add Service
//         </Button>
//       </div>

//       {/* Search */}
//       <div className="relative max-w-md">
//         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//         <Input
//           placeholder="Search services..."
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           className="pl-9 bg-background/50"
//         />
//       </div>

//       {/* Services Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {filteredServices.map((service) => (
//           <Card
//             key={service.id}
//             className="group border-border-black-40 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.22)] hover:border-black/20"
//           >
//             <CardHeader className="pb-4 pt-5 px-5">
//               <div className="flex items-start justify-between">
//                 <Badge variant="outline" className="font-medium text-xs
//              border-black-200
//              bg-white-50
//              text-[#111111]">
//                   {service.category}
//                 </Badge>
//                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                   <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-100" onClick={() => handleOpenDialog(service)}>
//                     <Edit2 className="w-4 h-4 text-black" />
//                   </Button>
//                   <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-100 hover:text-red-600" onClick={() => handleDelete(service.id)}>
//                     <Trash2 className="w-3.5 h-3.5" />
//                   </Button>
//                 </div>
//               </div>
//               <CardTitle className="font-heading text-lg mt-3 text-zinc-900 leading-snug">{service.name}</CardTitle>
//             </CardHeader>
//             <CardContent className="pb-5 px-5">
//               <p className="text-sm text-zinc-500 line-clamp-2 mb-5 font-medium">{service.description}</p>
//               {/* <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
//                 <div className="flex items-center gap-2">
//                   <span className="font-heading font-bold text-xl text-primary">
//                     {(currency === 'INR' ? '₹' : '$')}
//                     {(
//                       service.billing_type === 'monthly'
//                         ? service.base_price * Math.max(1, Number(service.duration_months || 1))
//                         : service.billing_type === 'milestone'
//                           ? (
//                             Array.isArray(service.milestone_template) &&
//                             service.milestone_template.length > 0
//                           )
//                             ? service.milestone_template.reduce(
//                               (sum, milestone) => sum + Number(milestone.amount || 0),
//                               0
//                             )
//                             : service.base_price
//                           : service.base_price
//                     ).toLocaleString()}
//                   </span>
//                 </div>
//                 <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold bg-zinc-100 text-zinc-600">
//                   {PRICING_MODEL_LABELS[service.pricing_model as PricingModel] || service.pricing_model}
//                 </Badge>
//               </div> */}

//               <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
//                 <div className="flex items-center gap-2">
//                   <span className="font-heading font-bold text-xl text-primary">
//                     {(currency === 'INR' ? '₹' : '$')}
//                     {(
//                       service.billing_type === 'monthly'
//                         ? service.base_price * Math.max(1, Number(service.duration_months || 1))
//                         : service.billing_type === 'milestone'
//                           ? (
//                             Array.isArray(service.milestone_template) &&
//                             service.milestone_template.length > 0
//                           )
//                             ? service.milestone_template.reduce(
//                               (sum, milestone) => sum + Number(milestone.amount || 0),
//                               0
//                             )
//                             : service.base_price
//                           : service.base_price
//                     ).toLocaleString()}
//                   </span>
//                 </div>

//                 <Button
//                   size="sm"
//                   className="bg-black text-white hover:bg-zinc-800 rounded-xl px-5"
//                   onClick={() => {
//                     setViewingService(service);
//                     setIsViewDialogOpen(true);
//                   }}
//                 >
//                   View
//                 </Button>
//               </div>
//               {service.addons && service.addons.length > 0 && (
//                 <div className="mt-4 pt-3 border-t border-border/40">
//                   <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-2">Add-ons</p>
//                   <div className="flex flex-wrap gap-1.5">
//                     {service.addons.slice(0, 2).map(addon => (
//                       <Badge key={addon.id} variant="outline" className="text-[10px] text-zinc-500 border-zinc-200">
//                         {addon.name}
//                       </Badge>
//                     ))}
//                     {service.addons.length > 2 && (
//                       <Badge variant="outline" className="text-[10px] text-zinc-400 border-dashed">
//                         +{service.addons.length - 2} more
//                       </Badge>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {filteredServices.length === 0 && (
//         <div className="text-center py-16">
//           <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
//             <Package className="w-8 h-8 text-muted-foreground" />
//           </div>
//           <p className="text-muted-foreground mb-4">
//             {searchQuery ? 'No services match your search' : 'No services yet'}
//           </p>
//           <Button onClick={() => handleOpenDialog()} variant="outline" className="gap-2">
//             <Plus className="w-4 h-4" /> Add your first service
//           </Button>
//         </div>
//       )}

//       {/* Add/Edit Dialog */}
//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-modern">
//           <DialogHeader>
//             <DialogTitle className="font-heading">
//               {editingService ? 'Edit Service' : 'Add New Service'}
//             </DialogTitle>
//             <DialogDescription>
//               {editingService ? 'Update service details and pricing.' : 'Add a new service to your catalog.'}
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-5 py-4">
//             {/* Basics */}
//             <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
//               <p className="text-xs uppercase tracking-wide text-accent font-bold">Basics</p>

//               <div className="relative">
//                 <Input
//                   id="name"
//                   value={formData.name}
//                   onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
//                   placeholder=" "
//                   className="peer h-14 pt-5 pb-1.5 px-4 rounded-xl border-input bg-background/60 transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
//                 />
//                 <Label
//                   htmlFor="name"
//                   className="absolute left-4 top-4 text-muted-foreground text-sm transition-all duration-200 pointer-events-none peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wide peer-focus:text-accent peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wide"
//                 >
//                   Service Name *
//                 </Label>
//                 <span className="pointer-events-none absolute left-4 right-4 bottom-1.5 h-[2px] rounded-full bg-accent scale-x-0 peer-focus:scale-x-100 origin-left transition-transform duration-500" />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
//                     Main Category
//                   </Label>

//                   <Select
//                     value={formData.category}
//                     onValueChange={(nextCategory) => {
//                       const nextSub = categoryMap[nextCategory]?.[0] || "";

//                       setFormData(prev => ({
//                         ...prev,
//                         category: nextCategory,
//                         subcategory: nextSub,
//                       }));
//                     }}
//                   >
//                     <SelectTrigger className="mt-1.5 h-11 rounded-xl border bg-background">
//                       <SelectValue />
//                     </SelectTrigger>

//                     <SelectContent className="rounded-xl">
//                       {mainCategories.map((cat) => (
//                         <SelectItem key={cat} value={cat}>
//                           {cat}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
//                     Sub-Category
//                   </Label>

//                   <Select
//                     value={formData.subcategory}
//                     onValueChange={(nextSub) => {
//                       setFormData(prev => ({
//                         ...prev,
//                         subcategory: nextSub,
//                         name: prev.name?.trim() ? prev.name : nextSub,
//                       }));
//                     }}
//                   >
//                     <SelectTrigger className="mt-1.5 h-11 rounded-xl border bg-background">
//                       <SelectValue />
//                     </SelectTrigger>

//                     <SelectContent className="rounded-xl">
//                       {subcategories.map((sub) => (
//                         <SelectItem key={sub} value={sub}>
//                           {sub}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             </div>

//             {/* Billing */}
//             <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
//               <p className="text-xs uppercase tracking-wide text-accent font-bold">Billing</p>

//               <div className="relative flex gap-1 p-1 rounded-2xl bg-muted">
//                 <div
//                   className="absolute top-1 bottom-1 rounded-xl bg-accent shadow-md transition-transform duration-300 ease-out"
//                   style={{
//                     width: '25%',
//                     transform: `translateX(${['one_time', 'monthly', 'retainer', 'milestone'].indexOf(formData.billing_type) * 100}%)`,
//                   }}
//                 />
//                 {[
//                   { value: 'one_time', label: 'One-time' },
//                   { value: 'monthly', label: 'Monthly' },
//                   { value: 'retainer', label: 'Retainer' },
//                   { value: 'milestone', label: 'Milestone' },
//                 ].map((opt) => (
//                   <button
//                     key={opt.value}
//                     type="button"
//                     onClick={() =>
//                       setFormData(prev => ({
//                         ...prev,
//                         billing_type: opt.value as 'one_time' | 'monthly' | 'milestone' | 'retainer',
//                       }))
//                     }
//                     className={`relative z-10 flex-1 py-2.5 text-xs font-semibold rounded-xl transition-colors duration-300 ${formData.billing_type === opt.value ? 'text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
//                       }`}
//                   >
//                     {opt.label}
//                   </button>
//                 ))}
//               </div>

//               {formData.billing_type === 'monthly' || formData.billing_type === 'retainer' ? (
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="base_price" className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
//                       Monthly Amount
//                     </Label>
//                     <Input
//                       id="base_price"
//                       type="number"
//                       value={formData.base_price}
//                       onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
//                       className="mt-1.5 rounded-xl transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="duration_months" className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
//                       Duration (months)
//                     </Label>
//                     <Input
//                       id="duration_months"
//                       type="number"
//                       min={1}
//                       value={formData.duration_months}
//                       onChange={(e) => setFormData(prev => ({ ...prev, duration_months: Math.max(1, parseInt(e.target.value || '1', 10)) }))}
//                       className="mt-1.5 rounded-xl transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
//                     />
//                   </div>
//                   <div className="col-span-2 flex items-center justify-between rounded-xl border border-dashed border-accent/30 bg-accent/5 px-4 py-2.5 animate-in">
//                     <span className="text-[11px] uppercase tracking-wide text-accent font-bold">Auto-calculated total</span>
//                     <span className="font-heading font-extrabold text-foreground">
//                       {(currency === 'INR' ? '₹' : '$')}{computedTotal.toLocaleString()}
//                     </span>
//                   </div>
//                 </div>
//               ) : formData.billing_type === 'milestone' ? (
//                 <div className="space-y-3">
//                   <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Milestones</Label>
//                   <div className="space-y-2">
//                     {formData.milestones.map((m, idx) => (
//                       <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-2 animate-in">
//                         <Input
//                           value={m.label}
//                           onChange={(e) =>
//                             setFormData((p) => ({
//                               ...p,
//                               milestones: p.milestones.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)),
//                             }))
//                           }
//                           className="rounded-xl transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
//                           placeholder="Label"
//                         />
//                         <Input
//                           type="number"
//                           value={m.amount}
//                           onChange={(e) =>
//                             setFormData((p) => ({
//                               ...p,
//                               milestones: p.milestones.map((x, i) => (i === idx ? { ...x, amount: e.target.value } : x)),
//                             }))
//                           }
//                           className="rounded-xl transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
//                           placeholder="Amount"
//                         />
//                       </div>
//                     ))}
//                   </div>
//                   <Button
//                     type="button"
//                     variant="outline"
//                     className="rounded-xl transition-colors duration-300 hover:bg-accent hover:text-accent-foreground"
//                     onClick={() =>
//                       setFormData((p) => ({ ...p, milestones: [...p.milestones, { label: `Milestone ${p.milestones.length + 1}`, amount: '' }] }))
//                     }
//                   >
//                     Add milestone
//                   </Button>
//                   <div className="flex items-center justify-between rounded-xl border border-dashed border-accent/30 bg-accent/5 px-4 py-2.5">
//                     <span className="text-[11px] uppercase tracking-wide text-accent font-bold">Total</span>
//                     <span className="font-heading font-extrabold text-foreground">
//                       {(currency === 'INR' ? '₹' : '$')}{computedTotal.toLocaleString()}
//                     </span>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="rounded-xl border border-dashed border-accent/30 bg-accent/5 p-4">
//                   <Label htmlFor="base_price" className="text-[11px] uppercase tracking-wide text-accent font-bold">
//                     Total Price
//                   </Label>
//                   <div className="flex items-center gap-2 mt-1">
//                     <span className="text-muted-foreground font-semibold">{currency === 'INR' ? '₹' : '$'}</span>
//                     <Input
//                       id="base_price"
//                       type="number"
//                       value={formData.base_price}
//                       onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
//                       className="border-none bg-transparent text-2xl font-heading font-extrabold p-0 h-auto focus-visible:ring-0 shadow-none"
//                     />
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Details */}
//             <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
//               <p className="text-xs uppercase tracking-wide text-accent font-bold">Details</p>

//               <div className="rounded-xl border border-input bg-background/60 p-3 transition-all duration-300 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
//                 <Label htmlFor="description" className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
//                   Description *
//                 </Label>
//                 <RichEditor
//                   id="description"
//                   value={formData.description}
//                   onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
//                   className="mt-1.5"
//                   rows={3}
//                   placeholder="Describe what's included in this service..."
//                 />
//               </div>

//               <div className="rounded-xl border border-input bg-background/60 p-3 transition-all duration-300 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
//                 <Label htmlFor="scope_of_work" className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
//                   Scope of Work *
//                 </Label>
//                 <RichEditor
//                   id="scope_of_work"
//                   value={formData.scope_of_work}
//                   onChange={(val) => setFormData(prev => ({ ...prev, scope_of_work: val }))}
//                   className="mt-1.5"
//                   rows={4}
//                   placeholder="Required. This will be used when adding the service to quotations."
//                 />
//               </div>

//               <div className="rounded-xl border border-input bg-background/60 p-3 transition-all duration-300 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
//                 <Label htmlFor="deliverables" className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
//                   Deliverables
//                 </Label>
//                 <RichEditor
//                   id="deliverables"
//                   value={formData.deliverables}
//                   onChange={(val) => setFormData(prev => ({ ...prev, deliverables: val }))}
//                   className="mt-1.5"
//                   rows={3}
//                   placeholder="Optional deliverables list (used when adding to quotations)."
//                 />
//               </div>

//               <div className="rounded-xl border border-input bg-background/60 p-4 space-y-3 transition-all duration-300 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
//                 <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
//                   Timeline
//                 </Label>

//                 <div className="flex items-center gap-3">
//                   {/* Stepper */}
//                   <div className="flex items-center rounded-xl border border-border/60 bg-card overflow-hidden shrink-0">
//                     <button
//                       type="button"
//                       onClick={() => updateTimeline(timelineUnit, timelineAmount - 1)}
//                       disabled={timelineAmount <= 1}
//                       className="h-11 w-10 flex items-center justify-center text-muted-foreground hover:bg-accent/10 hover:text-accent disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
//                     >
//                       −
//                     </button>
//                     <input
//                       type="number"
//                       min={1}
//                       max={TIMELINE_UNIT_MAX[timelineUnit]}
//                       value={timelineAmount}
//                       onChange={(e) => {
//                         const raw = parseInt(e.target.value, 10);
//                         updateTimeline(timelineUnit, Number.isFinite(raw) ? raw : 1);
//                       }}
//                       className="h-11 w-14 text-center font-heading font-bold text-foreground bg-transparent border-none outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => updateTimeline(timelineUnit, timelineAmount + 1)}
//                       disabled={timelineAmount >= TIMELINE_UNIT_MAX[timelineUnit]}
//                       className="h-11 w-10 flex items-center justify-center text-muted-foreground hover:bg-accent/10 hover:text-accent disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
//                     >
//                       +
//                     </button>
//                   </div>

//                   {/* Unit segmented control */}
//                   <div className="relative flex flex-1 gap-1 p-1 rounded-xl bg-muted">
//                     <div
//                       className="absolute top-1 bottom-1 rounded-lg bg-accent shadow-md transition-transform duration-300 ease-out"
//                       style={{
//                         width: 'calc(33.333% - 0.166rem)',
//                         transform: `translateX(${(['Days', 'Weeks', 'Months'] as TimelineUnit[]).indexOf(timelineUnit) * 100}%)`,
//                       }}
//                     />
//                     {(['Days', 'Weeks', 'Months'] as TimelineUnit[]).map((unit) => (
//                       <button
//                         key={unit}
//                         type="button"
//                         onClick={() => updateTimeline(unit, Math.min(timelineAmount, TIMELINE_UNIT_MAX[unit]))}
//                         className={`relative z-10 flex-1 py-2 text-xs font-semibold rounded-lg transition-colors duration-300 ${timelineUnit === unit ? 'text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
//                           }`}
//                       >
//                         {unit}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 <p className="text-[11px] text-muted-foreground">
//                   Max {TIMELINE_UNIT_MAX[timelineUnit]} {timelineUnit.toLowerCase()} · Currently: <span className="font-semibold text-foreground">{formatTimelineString(timelineUnit, timelineAmount)}</span>
//                 </p>
//               </div>

//               <div className="grid grid-cols-1 gap-4">
//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="payment_terms"
//                     className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold"
//                   >
//                     Payment Terms (optional)
//                   </Label>

//                   <Textarea
//                     id="payment_terms"
//                     value={formData.payment_terms}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         payment_terms: e.target.value,
//                       }))
//                     }
//                     rows={5}
//                     placeholder="Enter any payment-specific terms..."
//                     className="rounded-xl border-input bg-background/60 px-4 py-3 resize-none transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="service_terms"
//                     className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold"
//                   >
//                     Service-specific terms (optional)
//                   </Label>

//                   <Textarea
//                     id="service_terms"
//                     value={formData.service_terms}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         service_terms: e.target.value,
//                       }))
//                     }
//                     rows={5}
//                     placeholder="Enter any service-specific terms..."
//                     className="rounded-xl border-input bg-background/60 px-4 py-3 resize-none transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Add-ons */}
//             <div className="rounded-2xl border border-border/60 bg-card p-5">
//               <div className="flex items-center justify-between mb-3">
//                 <p className="text-xs uppercase tracking-wide text-accent font-bold">Add-ons (Optional)</p>
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   onClick={handleAddAddOn}
//                   className="gap-1 rounded-xl transition-colors duration-300 hover:bg-accent hover:text-accent-foreground"
//                 >
//                   <Plus className="w-3 h-3" /> Add
//                 </Button>
//               </div>
//               <div className="space-y-2">
//                 {formData.addons.map((addon, index) => (
//                   <div key={addon.id} className="flex gap-2 items-center animate-in group/row">
//                     <Input
//                       placeholder="Add-on name"
//                       value={addon.name}
//                       onChange={(e) => handleUpdateAddOn(index, 'name', e.target.value)}
//                       className="flex-1 rounded-xl transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
//                     />
//                     <Input
//                       type="number"
//                       placeholder="Price"
//                       value={addon.price}
//                       onChange={(e) => handleUpdateAddOn(index, 'price', parseFloat(e.target.value) || 0)}
//                       className="w-28 rounded-xl transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
//                     />
//                     <Button
//                       type="button"
//                       variant="ghost"
//                       size="icon"
//                       onClick={() => handleRemoveAddOn(index)}
//                       className="rounded-xl transition-all duration-300 hover:bg-destructive/10 hover:rotate-6"
//                     >
//                       <Trash2 className="w-4 h-4 text-destructive transition-transform duration-300 group-hover/row:scale-110" />
//                     </Button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
//             <Button onClick={handleSave} className="bg-accent text-accent-foreground hover:bg-accent/90">
//               {editingService ? 'Update Service' : 'Add Service'}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* View Service Dialog */}
//       <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
//         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-modern">
//           <DialogHeader>
//             <div className="flex items-center justify-between pr-8">
//               <DialogTitle className="font-heading text-xl">Service Details</DialogTitle>
//               {viewingService && (
//                 <div className="flex gap-2">
//                   <Badge variant="outline" className="text-zinc-600 border-zinc-200 bg-zinc-50">
//                     {viewingService.category}
//                   </Badge>
//                   {viewingService.subcategory && (
//                     <Badge variant="outline" className="text-muted-foreground">
//                       {viewingService.subcategory}
//                     </Badge>
//                   )}
//                 </div>
//               )}
//             </div>
//           </DialogHeader>

//           {viewingService && (
//             <div className="space-y-6 py-4">
//               <div>
//                 <h3 className="font-heading font-semibold text-lg">{viewingService.name}</h3>
//                 <RichTextDisplay content={viewingService.description || ''} className="text-muted-foreground mt-1" />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div className="p-3 bg-secondary/20 rounded-lg">
//                   <span className="text-xs text-muted-foreground uppercase tracking-wide">Pricing Model</span>
//                   {/* <p className="font-medium mt-1">
//                     {PRICING_MODEL_LABELS[viewingService.pricing_model as PricingModel] || viewingService.pricing_model}
//                   </p> */}
//                   <p className="font-medium mt-1 capitalize">
//                     {viewingService.billing_type.replace("_", " ")}
//                   </p>

//                 </div>
//                 <div className="p-3 bg-secondary/20 rounded-lg">
//                   <span className="text-xs text-muted-foreground uppercase tracking-wide">Price</span>
//                   <p className="font-heading font-bold text-xl text-primary">
//                     {(currency === "INR" ? "₹" : "$")}
//                     {(
//                       viewingService.billing_type === "monthly"
//                         ? viewingService.base_price *
//                         Math.max(1, Number(viewingService.duration_months || 1))

//                         : viewingService.billing_type === "milestone"
//                           ? viewingService.milestone_template?.length
//                             ? viewingService.milestone_template.reduce(
//                               (sum, m) => sum + Number(m.amount || 0),
//                               0
//                             )
//                             : viewingService.base_price

//                           : viewingService.base_price
//                     ).toLocaleString()}

//                     {viewingService.billing_type === "monthly" && "/mo"}
//                   </p>
//                 </div>
//               </div>

//               {viewingService.scope_of_work && (
//                 <div>
//                   <h4 className="font-medium mb-2">Scope of Work</h4>
//                   <div className="bg-muted/30 p-3 rounded-lg">
//                     <RichTextDisplay content={viewingService.scope_of_work} />
//                   </div>
//                 </div>
//               )}

//               {viewingService.deliverables && (
//                 <div>
//                   <h4 className="font-medium mb-2">Deliverables</h4>
//                   <div className="bg-muted/30 p-3 rounded-lg">
//                     <RichTextDisplay content={viewingService.deliverables} />
//                   </div>
//                 </div>
//               )}

//               {viewingService.timeline && (
//                 <div>
//                   <h4 className="font-medium mb-2">Timeline</h4>
//                   <p className="text-sm text-muted-foreground">{viewingService.timeline}</p>
//                 </div>
//               )}

//               <div className="grid grid-cols-2 gap-4">
//                 {viewingService.payment_terms && (
//                   <div>
//                     <h4 className="font-medium mb-2">Payment Terms</h4>
//                     <p className="text-sm text-muted-foreground">{viewingService.payment_terms}</p>
//                   </div>
//                 )}
//                 {viewingService.service_terms && (
//                   <div>
//                     <h4 className="font-medium mb-2">Service Terms</h4>
//                     <p className="text-sm text-muted-foreground">{viewingService.service_terms}</p>
//                   </div>
//                 )}
//               </div>

//               {/* Milestones (if applicable) */}
//               {viewingService.billing_type === 'milestone' && viewingService.milestone_template && viewingService.milestone_template.length > 0 && (
//                 <div>
//                   <h4 className="font-medium mb-2">Milestones</h4>
//                   <div className="border rounded-lg overflow-hidden">
//                     <table className="w-full text-sm">
//                       <thead className="bg-muted/50">
//                         <tr>
//                           <th className="px-3 py-2 text-left font-medium text-muted-foreground">Label</th>
//                           <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {viewingService.milestone_template.map((m, i) => (
//                           <tr key={i} className="border-t">
//                             <td className="px-3 py-2">{m.label}</td>
//                             <td className="px-3 py-2 text-right font-medium">
//                               {(currency === 'INR' ? '₹' : '$')}{m.amount.toLocaleString()}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               )}

//               {/* Add-ons */}
//               {viewingService.addons && viewingService.addons.length > 0 && (
//                 <div>
//                   <h4 className="font-medium mb-2">Available Add-ons</h4>
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
//                     {viewingService.addons.map((addon) => (
//                       <div key={addon.id} className="flex justify-between items-center p-3 border rounded-lg bg-card">
//                         <span className="text-sm font-medium">{addon.name}</span>
//                         <Badge variant="secondary">
//                           +{(currency === 'INR' ? '₹' : '$')}{addon.price.toLocaleString()}
//                         </Badge>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           <DialogFooter>
//             <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

import { useEffect, useState } from 'react';
import {
  Plus, Edit2, Trash2, Package, Search, Eye,
  Zap, Repeat, ShieldCheck, Milestone as MilestoneIcon,
  LayoutGrid, Tag, Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Service, PRICING_MODEL_LABELS, PricingModel } from '@/lib/types';
import { RichEditor, RichTextDisplay } from '@/components/ui/RichText';

type TimelineUnit = 'Days' | 'Weeks' | 'Months';

const TIMELINE_UNIT_MAX: Record<TimelineUnit, number> = {
  Days: 30,
  Weeks: 20,
  Months: 12,
};

function parseTimelineString(value: string): { unit: TimelineUnit; amount: number } {
  const match = (value || '').trim().match(/^(\d+)\s*(day|days|week|weeks|month|months)$/i);
  if (!match) return { unit: 'Weeks', amount: 1 };

  const amount = Math.max(1, parseInt(match[1], 10) || 1);
  const rawUnit = match[2].toLowerCase();

  let unit: TimelineUnit = 'Weeks';
  if (rawUnit.startsWith('day')) unit = 'Days';
  else if (rawUnit.startsWith('week')) unit = 'Weeks';
  else if (rawUnit.startsWith('month')) unit = 'Months';

  return { unit, amount: Math.min(amount, TIMELINE_UNIT_MAX[unit]) };
}

function formatTimelineString(unit: TimelineUnit, amount: number): string {
  const singular = unit.slice(0, -1);
  return `${amount} ${amount === 1 ? singular : unit}`;
}

const DEFAULT_CATEGORY_SUBCATEGORY: Record<string, string[]> = {
  Branding: [
    "Logo Design",
    "Brand Identity",
    "Brand Guidelines",
    "Business Profile",
    "Company Branding"
  ],

  "Content Creation": [
    "Social Media Content",
    "Blog Writing",
    "Copywriting",
    "Content Calendar",
    "Product Content"
  ],

  "Digital Marketing": [
    "SEO",
    "Google Ads",
    "Meta Ads",
    "Performance Marketing",
    "Lead Generation"
  ],

  "Graphic Designing": [
    "Poster Design",
    "Brochure Design",
    "Social Media Creatives",
    "Packaging Design",
    "Marketing Collateral"
  ],

  "Hosting & Website Maintenance": [
    "Website Hosting",
    "Website Maintenance",
    "Website Security",
    "Backup Management",
    "Performance Optimization"
  ],

  Other: [
    "Consulting",
    "Training",
    "Business Strategy",
    "Technical Support"
  ],

  "Photoshoot & Video Production": [
    "Corporate Shoot",
    "Product Shoot",
    "Event Coverage",
    "Promotional Video",
    "Drone Shoot"
  ],

  "Software Development": [
    "Web Application",
    "Mobile Application",
    "CRM Development",
    "ERP Development",
    "Custom Software"
  ],

  "Startup Kit": [
    "Startup Launch Package",
    "Branding + Website",
    "MVP Package",
    "Investor Deck",
    "Complete Startup Kit"
  ],

  "Video Editing": [
    "Reels Editing",
    "YouTube Editing",
    "Corporate Video Editing",
    "Motion Graphics",
    "Advertisement Editing"
  ],

  "website development": [
    "Business Website",
    "Corporate Website",
    "E-Commerce Website",
    "Landing Page",
    "Portfolio Website"
  ]
};

// ---------- Billing-type visual language ----------
// Every service card carries one of these four signals — icon, label, and
// accent color — so the billing model is readable at a glance without
// reading the fine print.
const BILLING_TYPE_META: Record
string,
  { label: string; icon: typeof Zap; accent: string; accentBg: string; accentText: string }
  > = {
  one_time: { label: 'One-time', icon: Zap, accent: '#111827', accentBg: 'bg-zinc-100', accentText: 'text-zinc-700' },
  monthly: { label: 'Monthly', icon: Repeat, accent: '#2563eb', accentBg: 'bg-blue-50', accentText: 'text-blue-700' },
  retainer: { label: 'Retainer', icon: ShieldCheck, accent: '#7c3aed', accentBg: 'bg-violet-50', accentText: 'text-violet-700' },
  milestone: { label: 'Milestone', icon: MilestoneIcon, accent: '#d97706', accentBg: 'bg-amber-50', accentText: 'text-amber-700' },
};

function getBillingMeta(billingType: string) {
  return BILLING_TYPE_META[billingType] || BILLING_TYPE_META.one_time;
}

// Single source of truth for "what does this service cost, total" — used by
// both the catalog stats and every card, so the number is always consistent.
function getServiceTotalValue(service: Service): number {
  if (service.billing_type === 'monthly' || service.billing_type === 'retainer') {
    return service.base_price * Math.max(1, Number(service.duration_months || 1));
  }
  if (service.billing_type === 'milestone') {
    return Array.isArray(service.milestone_template) && service.milestone_template.length > 0
      ? service.milestone_template.reduce((sum, m) => sum + Number(m.amount || 0), 0)
      : service.base_price;
  }
  return service.base_price;
}

interface LocalAddon {
  id: string;
  name: string;
  price: number;
}

export default function Services() {
  const { services, addService, updateService, deleteService, currency, serviceOptions } = useApp();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const firstCategory = Object.keys(DEFAULT_CATEGORY_SUBCATEGORY)[0] || '';
  const [timelineUnit, setTimelineUnit] = useState<TimelineUnit>('Weeks');
  const [timelineAmount, setTimelineAmount] = useState<number>(1);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category: string;
    subcategory: string;
    billing_type: 'one_time' | 'monthly' | 'milestone' | 'retainer';
    base_price: number;
    duration_months: number;
    milestones: Array<{ label: string; amount: string }>;
    addons: LocalAddon[];
    scope_of_work: string;
    deliverables: string;
    timeline: string;
    payment_terms: string;
    service_terms: string;
  }>({
    name: '',
    description: '',
    category: firstCategory,
    subcategory: DEFAULT_CATEGORY_SUBCATEGORY[firstCategory]?.[0] || '',
    billing_type: 'one_time',
    base_price: 0,
    duration_months: 1,
    milestones: [
      { label: 'Milestone 1', amount: '' },
      { label: 'Milestone 2', amount: '' },
    ],
    addons: [],
    scope_of_work: '',
    deliverables: '',
    timeline: '',
    payment_terms: '',
    service_terms: '',
  });

  // ---------- Category chips (only categories that actually have services) ----------
  const categoriesInUse = Array.from(new Set(services.map((s) => s.category).filter(Boolean))) as string[];

  let filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (categoryFilter !== 'all') {
    filteredServices = filteredServices.filter((s) => s.category === categoryFilter);
  }

  // ---------- Catalog-level stats ----------
  const totalServices = services.length;
  const totalCategories = categoriesInUse.length;
  const catalogValue = services.reduce((sum, s) => sum + getServiceTotalValue(s), 0);

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      const parsedTimeline = parseTimelineString(service.timeline || '');
      setTimelineUnit(parsedTimeline.unit);
      setTimelineAmount(parsedTimeline.amount);
      setFormData({
        name: service.name,
        description: service.description || '',
        category: service.category || firstCategory,
        subcategory: (service.subcategory || '').trim() || (categoryMap[service.category || firstCategory]?.[0] || ''),
        billing_type:
          service.billing_type === 'monthly'
            ? 'monthly'
            : service.billing_type === 'milestone'
              ? 'milestone'
              : service.billing_type === 'retainer'
                ? 'retainer'
                : 'one_time',
        base_price: service.base_price,
        duration_months: typeof service.duration_months === 'number' && Number.isFinite(service.duration_months) ? service.duration_months : 1,
        milestones: (service.milestone_template || []).map((m) => ({ label: m.label, amount: String(m.amount) })).length
          ? (service.milestone_template || []).map((m) => ({ label: m.label, amount: String(m.amount) }))
          : [
            { label: 'Milestone 1', amount: '' },
            { label: 'Milestone 2', amount: '' },
          ],
        addons: (service.addons || []).map(a => ({ id: a.id, name: a.name, price: a.price })),
        scope_of_work: service.scope_of_work || '',
        deliverables: service.deliverables || '',
        timeline: service.timeline || '',
        payment_terms: service.payment_terms || '',
        service_terms: service.service_terms || '',
      });
    } else {
      setEditingService(null);
      setTimelineUnit('Weeks');
      setTimelineAmount(1);
      const firstCategory = Object.keys(DEFAULT_CATEGORY_SUBCATEGORY)[0] || '';

      setFormData({
        name: '',
        description: '',
        category: firstCategory,
        subcategory: DEFAULT_CATEGORY_SUBCATEGORY[firstCategory]?.[0] || '',
        billing_type: 'one_time',
        base_price: 0,
        duration_months: 1,
        milestones: [
          { label: 'Milestone 1', amount: '' },
          { label: 'Milestone 2', amount: '' },
        ],
        addons: [],
        scope_of_work: '',
        deliverables: '',
        timeline: '',
        payment_terms: '',
        service_terms: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.scope_of_work.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const serviceData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory || null,
      billing_type: formData.billing_type,
      duration_months:
        formData.billing_type === 'monthly' || formData.billing_type === 'retainer'
          ? Math.max(1, Number(formData.duration_months || 1))
          : null,
      milestone_template:
        formData.billing_type === 'milestone'
          ? (formData.milestones || [])
            .map((m) => ({ label: (m.label || '').trim() || 'Milestone', amount: Number(m.amount || 0) }))
            .filter((m) => m.amount > 0)
          : null,
      // For monthly/retainer: store monthly amount in base_price
      // For one-time: store total price in base_price
      // For milestone: base_price is informational only
      base_price: Number(formData.base_price || 0),

      // Legacy fields (do not remove): keep a safe mapping so older screens don't crash
      pricing_model: (formData.billing_type === 'monthly' || formData.billing_type === 'retainer' ? 'monthly' : formData.billing_type === 'milestone' ? 'package' : 'fixed') as PricingModel,

      is_active: true,
      scope_of_work: formData.scope_of_work,
      deliverables: formData.deliverables || null,
      timeline: formData.timeline || null,
      payment_terms: formData.payment_terms || null,
      service_terms: formData.service_terms || null,
      addons: formData.addons.map(a => ({
        id: a.id,
        service_id: editingService?.id || '',
        name: a.name,
        price: a.price,
      })),
    };

    try {
      if (editingService) {
        await updateService({ ...editingService, ...serviceData });
        toast({ title: "Service updated", description: "Service has been updated successfully." });
      } else {
        await addService(serviceData);
        toast({ title: "Service added", description: "New service has been added to your catalog." });
      }
      setIsDialogOpen(false);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Service mutation failed', err);
      toast({ title: 'Error', description: 'Failed to save service', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteService(id);
      toast({ title: "Service deleted", description: "Service has been removed from your catalog." });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Service delete failed', err);
      toast({ title: 'Error', description: 'Failed to delete service', variant: 'destructive' });
    }
  };

  const handleAddAddOn = () => {
    setFormData(prev => ({
      ...prev,
      addons: [...prev.addons, { id: Date.now().toString(), name: '', price: 0 }],
    }));
  };

  const handleUpdateAddOn = (index: number, field: keyof LocalAddon, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.map((addon, i) =>
        i === index ? { ...addon, [field]: value } : addon
      ),
    }));
  };

  const handleRemoveAddOn = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index),
    }));
  };

  const updateTimeline = (unit: TimelineUnit, amount: number) => {
    const clamped = Math.min(Math.max(1, amount), TIMELINE_UNIT_MAX[unit]);
    setTimelineUnit(unit);
    setTimelineAmount(clamped);
    setFormData(prev => ({ ...prev, timeline: formatTimelineString(unit, clamped) }));
  };

  const categoryMap = (serviceOptions.service_categories && Object.keys(serviceOptions.service_categories).length > 0)
    ? serviceOptions.service_categories
    : DEFAULT_CATEGORY_SUBCATEGORY;

  const mainCategories = Object.keys(categoryMap);

  // If current category no longer exists (removed in Settings), fall back safely.
  const safeCategory = categoryMap[formData.category]
    ? formData.category
    : (mainCategories[0] || firstCategory);

  const subcategories = categoryMap[safeCategory] || [];

  // Keep the form state in sync with safeCategory so dropdown stays selectable.
  useEffect(() => {
    if (safeCategory !== formData.category) {
      setFormData((p) => ({ ...p, category: safeCategory, subcategory: (categoryMap[safeCategory]?.[0] || '') }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeCategory]);

  const computedTotal =
    formData.billing_type === 'monthly' || formData.billing_type === 'retainer'
      ? (Number(formData.base_price || 0) * Math.max(1, Number(formData.duration_months || 1)))
      : formData.billing_type === 'milestone'
        ? (formData.milestones || []).reduce((sum, m) => sum + (Number(m.amount || 0) || 0), 0)
        : Number(formData.base_price || 0);

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Services</h1>
          <p className="text-muted-foreground mt-1">Manage your service catalog and pricing.</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-[#111111] text-white hover:bg-black/80 gap-2 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </Button>
      </div>

      {/* Catalog stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-5 h-5 text-zinc-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Services</p>
              <p className="font-heading font-bold text-xl text-foreground">{totalServices}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5 text-zinc-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Categories</p>
              <p className="font-heading font-bold text-xl text-foreground">{totalCategories}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-zinc-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Catalog Value</p>
              <p className="font-heading font-bold text-xl text-foreground">
                {currencySymbol}{catalogValue.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background/50"
        />
      </div>

      {/* Category filter chips */}
      {categoriesInUse.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={categoryFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('all')}
            className={`rounded-full h-8 px-3 ${categoryFilter === 'all' ? 'bg-[#111111] text-white hover:bg-black/80' : ''}`}
          >
            All
          </Button>
          {categoriesInUse.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
              className={`rounded-full h-8 px-3 ${categoryFilter === cat ? 'bg-[#111111] text-white hover:bg-black/80' : ''}`}
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => {
          const meta = getBillingMeta(service.billing_type);
          const BillingIcon = meta.icon;
          const total = getServiceTotalValue(service);

          return (
            <Card
              key={service.id}
              className="group relative overflow-hidden border-border/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.16)] hover:border-black/20"
            >
              {/* Signature accent bar — color-coded by billing model */}
              <div
                className="absolute left-0 top-0 h-full w-1"
                style={{ backgroundColor: meta.accent }}
              />

              <CardHeader className="pb-4 pt-5 pl-6 pr-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-medium text-xs border-zinc-200 bg-white text-[#111111]">
                      {service.category}
                    </Badge>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.accentBg} ${meta.accentText}`}
                    >
                      <BillingIcon className="w-3 h-3" />
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-100" onClick={() => handleOpenDialog(service)}>
                      <Edit2 className="w-4 h-4 text-black" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-100 hover:text-red-600" onClick={() => handleDelete(service.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="font-heading text-lg mt-3 text-zinc-900 leading-snug pl-1">{service.name}</CardTitle>
              </CardHeader>
              <CardContent className="pb-5 pl-6 pr-5">
                <p className="text-sm text-zinc-500 line-clamp-2 mb-5 font-medium">{service.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-xl text-primary">
                      {currencySymbol}{total.toLocaleString()}
                      {service.billing_type === 'monthly' && (
                        <span className="text-sm font-medium text-muted-foreground">/mo total</span>
                      )}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    className="bg-black text-white hover:bg-zinc-800 rounded-xl px-5"
                    onClick={() => {
                      setViewingService(service);
                      setIsViewDialogOpen(true);
                    }}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    View
                  </Button>
                </div>
                {service.addons && service.addons.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/40">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-2">Add-ons</p>
                    <div className="flex flex-wrap gap-1.5">
                      {service.addons.slice(0, 2).map(addon => (
                        <Badge key={addon.id} variant="outline" className="text-[10px] text-zinc-500 border-zinc-200">
                          {addon.name}
                        </Badge>
                      ))}
                      {service.addons.length > 2 && (
                        <Badge variant="outline" className="text-[10px] text-zinc-400 border-dashed">
                          +{service.addons.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            {searchQuery || categoryFilter !== 'all'
              ? 'No services match your filters.'
              : 'Your catalog is empty — add your first service to start building quotations.'}
          </p>
          <Button onClick={() => handleOpenDialog()} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Add your first service
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-modern">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
            <DialogDescription>
              {editingService ? 'Update service details and pricing.' : 'Add a new service to your catalog.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Basics */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
              <p className="text-xs uppercase tracking-wide text-accent font-bold">Basics</p>

              <div className="relative">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder=" "
                  className="peer h-14 pt-5 pb-1.5 px-4 rounded-xl border-input bg-background/60 transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
                />
                <Label
                  htmlFor="name"
                  className="absolute left-4 top-4 text-muted-foreground text-sm transition-all duration-200 pointer-events-none peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wide peer-focus:text-accent peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wide"
                >
                  Service Name *
                </Label>
                <span className="pointer-events-none absolute left-4 right-4 bottom-1.5 h-[2px] rounded-full bg-accent scale-x-0 peer-focus:scale-x-100 origin-left transition-transform duration-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Main Category
                  </Label>

                  <Select
                    value={formData.category}
                    onValueChange={(nextCategory) => {
                      const nextSub = categoryMap[nextCategory]?.[0] || "";

                      setFormData(prev => ({
                        ...prev,
                        category: nextCategory,
                        subcategory: nextSub,
                      }));
                    }}
                  >
                    <SelectTrigger className="mt-1.5 h-11 rounded-xl border bg-background">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent className="rounded-xl">
                      {mainCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Sub-Category
                  </Label>

                  <Select
                    value={formData.subcategory}
                    onValueChange={(nextSub) => {
                      setFormData(prev => ({
                        ...prev,
                        subcategory: nextSub,
                        name: prev.name?.trim() ? prev.name : nextSub,
                      }));
                    }}
                  >
                    <SelectTrigger className="mt-1.5 h-11 rounded-xl border bg-background">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent className="rounded-xl">
                      {subcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Billing */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
              <p className="text-xs uppercase tracking-wide text-accent font-bold">Billing</p>

              <div className="relative flex gap-1 p-1 rounded-2xl bg-muted">
                <div
                  className="absolute top-1 bottom-1 rounded-xl bg-accent shadow-md transition-transform duration-300 ease-out"
                  style={{
                    width: '25%',
                    transform: `translateX(${['one_time', 'monthly', 'retainer', 'milestone'].indexOf(formData.billing_type) * 100}%)`,
                  }}
                />
                {[
                  { value: 'one_time', label: 'One-time' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'retainer', label: 'Retainer' },
                  { value: 'milestone', label: 'Milestone' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        billing_type: opt.value as 'one_time' | 'monthly' | 'milestone' | 'retainer',
                      }))
                    }
                    className={`relative z-10 flex-1 py-2.5 text-xs font-semibold rounded-xl transition-colors duration-300 ${formData.billing_type === opt.value ? 'text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {formData.billing_type === 'monthly' || formData.billing_type === 'retainer' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="base_price" className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                      Monthly Amount
                    </Label>
                    <Input
                      id="base_price"
                      type="number"
                      value={formData.base_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                      className="mt-1.5 rounded-xl transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration_months" className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                      Duration (months)
                    </Label>
                    <Input
                      id="duration_months"
                      type="number"
                      min={1}
                      value={formData.duration_months}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_months: Math.max(1, parseInt(e.target.value || '1', 10)) }))}
                      className="mt-1.5 rounded-xl transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between rounded-xl border border-dashed border-accent/30 bg-accent/5 px-4 py-2.5 animate-in">
                    <span className="text-[11px] uppercase tracking-wide text-accent font-bold">Auto-calculated total</span>
                    <span className="font-heading font-extrabold text-foreground">
                      {currencySymbol}{computedTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : formData.billing_type === 'milestone' ? (
                <div className="space-y-3">
                  <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Milestones</Label>
                  <div className="space-y-2">
                    {formData.milestones.map((m, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-2 animate-in">
                        <Input
                          value={m.label}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              milestones: p.milestones.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)),
                            }))
                          }
                          className="rounded-xl transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
                          placeholder="Label"
                        />
                        <Input
                          type="number"
                          value={m.amount}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              milestones: p.milestones.map((x, i) => (i === idx ? { ...x, amount: e.target.value } : x)),
                            }))
                          }
                          className="rounded-xl transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
                          placeholder="Amount"
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl transition-colors duration-300 hover:bg-accent hover:text-accent-foreground"
                    onClick={() =>
                      setFormData((p) => ({ ...p, milestones: [...p.milestones, { label: `Milestone ${p.milestones.length + 1}`, amount: '' }] }))
                    }
                  >
                    Add milestone
                  </Button>
                  <div className="flex items-center justify-between rounded-xl border border-dashed border-accent/30 bg-accent/5 px-4 py-2.5">
                    <span className="text-[11px] uppercase tracking-wide text-accent font-bold">Total</span>
                    <span className="font-heading font-extrabold text-foreground">
                      {currencySymbol}{computedTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-accent/30 bg-accent/5 p-4">
                  <Label htmlFor="base_price" className="text-[11px] uppercase tracking-wide text-accent font-bold">
                    Total Price
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted-foreground font-semibold">{currencySymbol}</span>
                    <Input
                      id="base_price"
                      type="number"
                      value={formData.base_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                      className="border-none bg-transparent text-2xl font-heading font-extrabold p-0 h-auto focus-visible:ring-0 shadow-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
              <p className="text-xs uppercase tracking-wide text-accent font-bold">Details</p>

              <div className="rounded-xl border border-input bg-background/60 p-3 transition-all duration-300 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
                <Label htmlFor="description" className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Description *
                </Label>
                <RichEditor
                  id="description"
                  value={formData.description}
                  onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                  className="mt-1.5"
                  rows={3}
                  placeholder="Describe what's included in this service..."
                />
              </div>

              <div className="rounded-xl border border-input bg-background/60 p-3 transition-all duration-300 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
                <Label htmlFor="scope_of_work" className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Scope of Work *
                </Label>
                <RichEditor
                  id="scope_of_work"
                  value={formData.scope_of_work}
                  onChange={(val) => setFormData(prev => ({ ...prev, scope_of_work: val }))}
                  className="mt-1.5"
                  rows={4}
                  placeholder="Required. This will be used when adding the service to quotations."
                />
              </div>

              <div className="rounded-xl border border-input bg-background/60 p-3 transition-all duration-300 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
                <Label htmlFor="deliverables" className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Deliverables
                </Label>
                <RichEditor
                  id="deliverables"
                  value={formData.deliverables}
                  onChange={(val) => setFormData(prev => ({ ...prev, deliverables: val }))}
                  className="mt-1.5"
                  rows={3}
                  placeholder="Optional deliverables list (used when adding to quotations)."
                />
              </div>

              <div className="rounded-xl border border-input bg-background/60 p-4 space-y-3 transition-all duration-300 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Timeline
                </Label>

                <div className="flex items-center gap-3">
                  {/* Stepper */}
                  <div className="flex items-center rounded-xl border border-border/60 bg-card overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => updateTimeline(timelineUnit, timelineAmount - 1)}
                      disabled={timelineAmount <= 1}
                      className="h-11 w-10 flex items-center justify-center text-muted-foreground hover:bg-accent/10 hover:text-accent disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={TIMELINE_UNIT_MAX[timelineUnit]}
                      value={timelineAmount}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value, 10);
                        updateTimeline(timelineUnit, Number.isFinite(raw) ? raw : 1);
                      }}
                      className="h-11 w-14 text-center font-heading font-bold text-foreground bg-transparent border-none outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateTimeline(timelineUnit, timelineAmount + 1)}
                      disabled={timelineAmount >= TIMELINE_UNIT_MAX[timelineUnit]}
                      className="h-11 w-10 flex items-center justify-center text-muted-foreground hover:bg-accent/10 hover:text-accent disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Unit segmented control */}
                  <div className="relative flex flex-1 gap-1 p-1 rounded-xl bg-muted">
                    <div
                      className="absolute top-1 bottom-1 rounded-lg bg-accent shadow-md transition-transform duration-300 ease-out"
                      style={{
                        width: 'calc(33.333% - 0.166rem)',
                        transform: `translateX(${(['Days', 'Weeks', 'Months'] as TimelineUnit[]).indexOf(timelineUnit) * 100}%)`,
                      }}
                    />
                    {(['Days', 'Weeks', 'Months'] as TimelineUnit[]).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => updateTimeline(unit, Math.min(timelineAmount, TIMELINE_UNIT_MAX[unit]))}
                        className={`relative z-10 flex-1 py-2 text-xs font-semibold rounded-lg transition-colors duration-300 ${timelineUnit === unit ? 'text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Max {TIMELINE_UNIT_MAX[timelineUnit]} {timelineUnit.toLowerCase()} · Currently: <span className="font-semibold text-foreground">{formatTimelineString(timelineUnit, timelineAmount)}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="payment_terms"
                    className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold"
                  >
                    Payment Terms (optional)
                  </Label>

                  <Textarea
                    id="payment_terms"
                    value={formData.payment_terms}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        payment_terms: e.target.value,
                      }))
                    }
                    rows={5}
                    placeholder="Enter any payment-specific terms..."
                    className="rounded-xl border-input bg-background/60 px-4 py-3 resize-none transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="service_terms"
                    className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold"
                  >
                    Service-specific terms (optional)
                  </Label>

                  <Textarea
                    id="service_terms"
                    value={formData.service_terms}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        service_terms: e.target.value,
                      }))
                    }
                    rows={5}
                    placeholder="Enter any service-specific terms..."
                    className="rounded-xl border-input bg-background/60 px-4 py-3 resize-none transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Add-ons */}
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-wide text-accent font-bold">Add-ons (Optional)</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAddOn}
                  className="gap-1 rounded-xl transition-colors duration-300 hover:bg-accent hover:text-accent-foreground"
                >
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {formData.addons.map((addon, index) => (
                  <div key={addon.id} className="flex gap-2 items-center animate-in group/row">
                    <Input
                      placeholder="Add-on name"
                      value={addon.name}
                      onChange={(e) => handleUpdateAddOn(index, 'name', e.target.value)}
                      className="flex-1 rounded-xl transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={addon.price}
                      onChange={(e) => handleUpdateAddOn(index, 'price', parseFloat(e.target.value) || 0)}
                      className="w-28 rounded-xl transition-all duration-300 focus-visible:ring-4 focus-visible:ring-accent/10 focus:border-accent"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAddOn(index)}
                      className="rounded-xl transition-all duration-300 hover:bg-destructive/10 hover:rotate-6"
                    >
                      <Trash2 className="w-4 h-4 text-destructive transition-transform duration-300 group-hover/row:scale-110" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {editingService ? 'Update Service' : 'Add Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Service Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-modern">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="font-heading text-xl">Service Details</DialogTitle>
              {viewingService && (
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-zinc-600 border-zinc-200 bg-zinc-50">
                    {viewingService.category}
                  </Badge>
                  {viewingService.subcategory && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {viewingService.subcategory}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </DialogHeader>

          {viewingService && (
            <div className="space-y-6 py-4">
              <div>
                <h3 className="font-heading font-semibold text-lg">{viewingService.name}</h3>
                <RichTextDisplay content={viewingService.description || ''} className="text-muted-foreground mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Pricing Model</span>
                  <p className="font-medium mt-1 capitalize">
                    {viewingService.billing_type.replace("_", " ")}
                  </p>
                </div>
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Price</span>
                  <p className="font-heading font-bold text-xl text-primary">
                    {currencySymbol}{getServiceTotalValue(viewingService).toLocaleString()}
                    {viewingService.billing_type === "monthly" && "/mo"}
                  </p>
                </div>
              </div>

              {viewingService.scope_of_work && (
                <div>
                  <h4 className="font-medium mb-2">Scope of Work</h4>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <RichTextDisplay content={viewingService.scope_of_work} />
                  </div>
                </div>
              )}

              {viewingService.deliverables && (
                <div>
                  <h4 className="font-medium mb-2">Deliverables</h4>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <RichTextDisplay content={viewingService.deliverables} />
                  </div>
                </div>
              )}

              {viewingService.timeline && (
                <div>
                  <h4 className="font-medium mb-2">Timeline</h4>
                  <p className="text-sm text-muted-foreground">{viewingService.timeline}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {viewingService.payment_terms && (
                  <div>
                    <h4 className="font-medium mb-2">Payment Terms</h4>
                    <p className="text-sm text-muted-foreground">{viewingService.payment_terms}</p>
                  </div>
                )}
                {viewingService.service_terms && (
                  <div>
                    <h4 className="font-medium mb-2">Service Terms</h4>
                    <p className="text-sm text-muted-foreground">{viewingService.service_terms}</p>
                  </div>
                )}
              </div>

              {/* Milestones (if applicable) */}
              {viewingService.billing_type === 'milestone' && viewingService.milestone_template && viewingService.milestone_template.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Milestones</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Label</th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingService.milestone_template.map((m, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2">{m.label}</td>
                            <td className="px-3 py-2 text-right font-medium">
                              {currencySymbol}{m.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {viewingService.addons && viewingService.addons.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Available Add-ons</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewingService.addons.map((addon) => (
                      <div key={addon.id} className="flex justify-between items-center p-3 border rounded-lg bg-card">
                        <span className="text-sm font-medium">{addon.name}</span>
                        <Badge variant="secondary">
                          +{currencySymbol}{addon.price.toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}