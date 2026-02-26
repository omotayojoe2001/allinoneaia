import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { recordStockSale } from "@/lib/business-integration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, Package, TrendingUp, AlertTriangle, ShoppingCart, Download, Search, Filter, HelpCircle, Calendar, Folder } from "lucide-react";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageAIAgent } from "@/components/PageAIAgent";
import { pageAgentConfigs } from "@/lib/page-agent-configs";

export default function StockManagement() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "groups" | "products" | "sales" | "reports">("dashboard");
  const [products, setProducts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [productOpen, setProductOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [reportPage, setReportPage] = useState(1);
  const [reportFilter, setReportFilter] = useState({ type: "all", customer: "", startDate: "", endDate: "" });
  const [form, setForm] = useState({
    name: "", sku: "", barcode: "", category: "", description: "", unit_price: "", cost_price: "",
    supplier: "", quantity: "", reorder_level: "10", status: "active", location: "", group_id: ""
  });
  const [groupForm, setGroupForm] = useState({ name: "", description: "", color: "#3B82F6" });
  const [saleItems, setSaleItems] = useState([{ product_id: "", quantity: 1, price: 0 }]);
  const [saleForm, setSaleForm] = useState({ customer_name: "", payment_method: "cash" });
  const { toast } = useToast();
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const [productsRes, groupsRes, salesRes, movementsRes, profileRes] = await Promise.all([
      supabase.from("stock").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("product_groups").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("stock_sales").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("stock_movements").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("id", user.id).single()
    ]);
    
    setProducts(productsRes.data || []);
    setGroups(groupsRes.data || []);
    setSales(salesRes.data || []);
    setMovements(movementsRes.data || []);
    setProfile(profileRes.data);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("stock").insert({
      user_id: user.id,
      name: form.name,
      sku: form.sku,
      barcode: form.barcode || null,
      category: form.category || null,
      description: form.description || null,
      unit_price: parseFloat(form.unit_price),
      cost_price: parseFloat(form.cost_price),
      supplier: form.supplier || null,
      quantity: parseInt(form.quantity),
      reorder_level: parseInt(form.reorder_level),
      status: form.status,
      location: form.location || null,
      group_id: form.group_id || null
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Product added" });
      setProductOpen(false);
      setForm({ name: "", sku: "", barcode: "", category: "", description: "", unit_price: "", cost_price: "", supplier: "", quantity: "", reorder_level: "10", status: "active", location: "", group_id: "" });
      fetchData();
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("product_groups").insert({
      user_id: user.id,
      name: groupForm.name,
      description: groupForm.description || null,
      color: groupForm.color
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Group created" });
      setGroupOpen(false);
      setGroupForm({ name: "", description: "", color: "#3B82F6" });
      fetchData();
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const subtotal = saleItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const total = subtotal;
    const saleNumber = `SALE-${Date.now()}`;

    // Calculate profit
    const profit = saleItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id);
      return sum + ((item.price - (product?.cost_price || 0)) * item.quantity);
    }, 0);

    const { data: saleData, error } = await supabase.from("stock_sales").insert({
      user_id: user.id,
      sale_number: saleNumber,
      customer_name: saleForm.customer_name || null,
      items: JSON.stringify(saleItems),
      subtotal,
      total,
      payment_method: saleForm.payment_method,
      status: "completed"
    }).select().single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Auto-record in cash book
    try {
      await recordStockSale(user.id, saleData.id, total, profit, new Date());
    } catch (err) {
      console.error("Failed to record in cash book:", err);
    }

    // Update stock and movements
    for (const item of saleItems) {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        await supabase.from("stock").update({ quantity: product.quantity - item.quantity }).eq("id", item.product_id);
        await supabase.from("stock_movements").insert({
          user_id: user.id,
          stock_id: item.product_id,
          type: "out",
          reason: "sale",
          quantity: item.quantity,
          reference: saleNumber
        });
      }
    }

    toast({ title: "Success", description: "Sale recorded and added to cash book" });
    setSaleOpen(false);
    setSaleItems([{ product_id: "", quantity: 1, price: 0 }]);
    setSaleForm({ customer_name: "", payment_method: "cash" });
    fetchData();
  };

  const currency = profile?.default_currency || "$";
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchesSupplier = supplierFilter === "all" || p.supplier === supplierFilter;
    const matchesGroup = selectedGroup === "all" || p.group_id === selectedGroup;
    return matchesSearch && matchesCategory && matchesSupplier && matchesGroup;
  });

  const getFilteredSalesByDate = () => {
    let filtered = sales;
    const now = new Date();
    if (dateFilter === "today") {
      filtered = sales.filter(s => new Date(s.created_at).toDateString() === now.toDateString());
    } else if (dateFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = sales.filter(s => new Date(s.created_at) >= weekAgo);
    } else if (dateFilter === "month") {
      filtered = sales.filter(s => new Date(s.created_at).getMonth() === now.getMonth());
    } else if (dateFilter === "custom" && customStartDate && customEndDate) {
      filtered = sales.filter(s => {
        const date = new Date(s.created_at);
        return date >= new Date(customStartDate) && date <= new Date(customEndDate);
      });
    }
    return filtered;
  };

  const filteredSales = getFilteredSalesByDate();
  const recentActivities = [...products.slice(0, 5).map(p => ({ type: 'product', data: p })), ...sales.slice(0, 5).map(s => ({ type: 'sale', data: s }))].sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()).slice(0, 10);

  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);
  const lowStock = products.filter(p => p.quantity <= p.reorder_level).length;
  const outOfStock = products.filter(p => p.quantity === 0).length;
  const todaySales = filteredSales.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString());
  const todayRevenue = todaySales.reduce((sum, s) => sum + parseFloat(s.total), 0);
  const monthSales = filteredSales.filter(s => new Date(s.created_at).getMonth() === new Date().getMonth());
  const monthRevenue = monthSales.reduce((sum, s) => sum + parseFloat(s.total), 0);
  const totalProfit = sales.reduce((sum, s) => {
    const items = JSON.parse(s.items || "[]");
    const profit = items.reduce((p: number, item: any) => {
      const product = products.find(pr => pr.id === item.product_id);
      return p + ((item.price - (product?.cost_price || 0)) * item.quantity);
    }, 0);
    return sum + profit;
  }, 0);

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const suppliers = [...new Set(products.map(p => p.supplier).filter(Boolean))];

  const filteredReportSales = sales.filter(s => {
    const matchesType = reportFilter.type === "all" || true;
    const matchesCustomer = !reportFilter.customer || (s.customer_name && s.customer_name.toLowerCase().includes(reportFilter.customer.toLowerCase()));
    const matchesDate = (!reportFilter.startDate || new Date(s.created_at) >= new Date(reportFilter.startDate)) && (!reportFilter.endDate || new Date(s.created_at) <= new Date(reportFilter.endDate));
    return matchesType && matchesCustomer && matchesDate;
  });
  const paginatedReports = filteredReportSales.slice((reportPage - 1) * itemsPerPage, reportPage * itemsPerPage);
  const totalReportPages = Math.ceil(filteredReportSales.length / itemsPerPage);

  return (
    <TooltipProvider>
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <PageAIAgent {...pageAgentConfigs.stock} />
      <div className="max-w-7xl mx-auto">
        <Link to="/business" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Stock Management</h1>
          <div className="flex gap-2">
            <Button variant={activeTab === "dashboard" ? "default" : "outline"} onClick={() => setActiveTab("dashboard")}>Dashboard</Button>
            <Button variant={activeTab === "groups" ? "default" : "outline"} onClick={() => setActiveTab("groups")}>Groups</Button>
            <Button variant={activeTab === "products" ? "default" : "outline"} onClick={() => setActiveTab("products")}>Products</Button>
            <Button variant={activeTab === "sales" ? "default" : "outline"} onClick={() => setActiveTab("sales")}>Sales</Button>
            <Button variant={activeTab === "reports" ? "default" : "outline"} onClick={() => setActiveTab("reports")}>Reports</Button>
          </div>
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex gap-2 items-center mb-4">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              {dateFilter === "custom" && (
                <>
                  <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-40" />
                  <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-40" />
                </>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-gray-600">Total Products</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{totalProducts}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-gray-600">Total Stock</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{totalQuantity}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                  <p className="text-sm text-gray-600">Stock Value</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">{currency}{totalValue.toFixed(2)}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-gray-600">Low Stock</p>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{lowStock}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Today's Sales</p>
                <p className="text-xl font-bold text-foreground">{currency}{todayRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{todaySales.length} transactions</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Month</p>
                <p className="text-xl font-bold text-foreground">{currency}{monthRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{monthSales.length} transactions</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Profit</p>
                <p className="text-xl font-bold text-green-600">{currency}{totalProfit.toFixed(2)}</p>
              </div>
            </div>

            {lowStock > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Low Stock Alerts</h3>
                <div className="space-y-1">
                  {products.filter(p => p.quantity <= p.reorder_level).slice(0, 5).map(p => (
                    <p key={p.id} className="text-sm text-yellow-700">{p.name} - Only {p.quantity} left</p>
                  ))}
                </div>
              </div>
            )}

            {outOfStock > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">❌ Out of Stock</h3>
                <div className="space-y-1">
                  {products.filter(p => p.quantity === 0).slice(0, 5).map(p => (
                    <p key={p.id} className="text-sm text-red-700">{p.name}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Recent Activities</h3>
              <div className="space-y-2">
                {recentActivities.map((activity, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      {activity.type === 'product' ? (
                        <Package className="w-4 h-4 text-blue-600" />
                      ) : (
                        <ShoppingCart className="w-4 h-4 text-green-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {activity.type === 'product' ? `Product Added: ${activity.data.name}` : `Sale: ${activity.data.sale_number}`}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(activity.data.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {activity.type === 'sale' && (
                      <span className="text-sm font-semibold text-green-600">{currency}{parseFloat(activity.data.total).toFixed(2)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "groups" && (
          <div className="space-y-4">
            <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />New Group</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Product Group</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleGroupSubmit} className="space-y-4">
                  <div>
                    <Label>Group Name *</Label>
                    <Input placeholder="e.g. Baby Products" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea placeholder="Optional description" value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <Input type="color" value={groupForm.color} onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full">Create Group</Button>
                </form>
              </DialogContent>
            </Dialog>
            <div className="grid grid-cols-4 gap-4">
              {groups.map(g => {
                const groupProducts = products.filter(p => p.group_id === g.id);
                const groupValue = groupProducts.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);
                return (
                  <div key={g.id} className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition" style={{ borderLeftWidth: '4px', borderLeftColor: g.color }} onClick={() => { setSelectedGroup(g.id); setActiveTab("products"); }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Folder className="w-5 h-5" style={{ color: g.color }} />
                      <p className="font-semibold">{g.name}</p>
                    </div>
                    {g.description && <p className="text-xs text-gray-600 mb-2">{g.description}</p>}
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-600">{groupProducts.length} products</span>
                      <span className="text-sm font-bold" style={{ color: g.color }}>{currency}{groupValue.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              {groups.map(g => (
                <Button key={g.id} variant={selectedGroup === g.id ? "default" : "outline"} size="sm" onClick={() => setSelectedGroup(g.id)} style={selectedGroup === g.id ? { backgroundColor: g.color, borderColor: g.color } : {}}>
                  {g.name}
                </Button>
              ))}
              <Button variant={selectedGroup === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedGroup("all")}>All Products</Button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input placeholder="Search by name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Dialog open={productOpen} onOpenChange={setProductOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" />Add Product</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-1">
                          Product Name *
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The name of your product as it will appear in your inventory</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input placeholder="e.g. Apple iPhone 13" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1">
                          SKU *
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Stock Keeping Unit - A unique code to identify this product (e.g. IPH13-BLK-128)</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input placeholder="e.g. PROD-001" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1">
                          Barcode
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Product barcode number for scanning (optional)</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input placeholder="e.g. 123456789012" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Input placeholder="e.g. Electronics" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1">
                          Unit Price *
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The price you sell this product for (selling price to customers)</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input type="number" step="0.01" placeholder="e.g. 50000" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} required />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1">
                          Cost Price *
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>How much you paid to buy/produce this product (your cost)</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input type="number" step="0.01" placeholder="e.g. 35000" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} required />
                      </div>
                      <div>
                        <Label>Supplier</Label>
                        <Input placeholder="e.g. ABC Distributors" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                      </div>
                      <div>
                        <Label>Quantity *</Label>
                        <Input type="number" placeholder="e.g. 100" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1">
                          Reorder Level
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Minimum quantity before you get a low stock alert (e.g. if set to 10, you'll be alerted when stock drops to 10 or below)</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input type="number" placeholder="e.g. 10" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} />
                      </div>
                      <div>
                        <Label>Location</Label>
                        <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Warehouse A" />
                      </div>
                      <div>
                        <Label>Product Group</Label>
                        <Select value={form.group_id} onValueChange={(v) => setForm({ ...form, group_id: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select group (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Group</SelectItem>
                            {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <Button type="submit" className="w-full">Add Product</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className={p.quantity <= p.reorder_level ? "bg-yellow-50" : ""}>
                      <td className="px-4 py-3 text-sm font-mono">{p.sku}</td>
                      <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-sm">{p.category || "-"}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={p.quantity === 0 ? "text-red-600 font-semibold" : p.quantity <= p.reorder_level ? "text-yellow-600 font-semibold" : ""}>
                          {p.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{currency}{parseFloat(p.unit_price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{currency}{(p.quantity * parseFloat(p.unit_price)).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${p.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="space-y-4">
            <Dialog open={saleOpen} onOpenChange={setSaleOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />New Sale</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Record Sale</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Customer Name</Label>
                      <Input value={saleForm.customer_name} onChange={(e) => setSaleForm({ ...saleForm, customer_name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <Select value={saleForm.payment_method} onValueChange={(v) => setSaleForm({ ...saleForm, payment_method: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="pos">POS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Items</Label>
                    {saleItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                        <Select value={item.product_id} onValueChange={(v) => {
                          const product = products.find(p => p.id === v);
                          const newItems = [...saleItems];
                          newItems[i] = { ...item, product_id: v, price: product?.unit_price || 0 };
                          setSaleItems(newItems);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.filter(p => p.quantity > 0).map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.quantity} left)</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => {
                          const newItems = [...saleItems];
                          newItems[i].quantity = parseInt(e.target.value);
                          setSaleItems(newItems);
                        }} />
                        <Input type="number" step="0.01" placeholder="Price" value={item.price} onChange={(e) => {
                          const newItems = [...saleItems];
                          newItems[i].price = parseFloat(e.target.value);
                          setSaleItems(newItems);
                        }} />
                      </div>
                    ))}
                    <Button type="button" size="sm" onClick={() => setSaleItems([...saleItems, { product_id: "", quantity: 1, price: 0 }])}>Add Item</Button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-lg font-bold">Total: {currency}{saleItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</p>
                  </div>
                  <Button type="submit" className="w-full">Complete Sale</Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Sale #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sales.map(s => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 text-sm font-mono">{s.sale_number}</td>
                      <td className="px-4 py-3 text-sm">{s.customer_name || "Walk-in"}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{currency}{parseFloat(s.total).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm capitalize">{s.payment_method}</td>
                      <td className="px-4 py-3 text-sm">{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
                <h3 className="font-semibold text-foreground mb-4">Sales Performance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Sales:</span>
                    <span className="font-semibold">{sales.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Revenue:</span>
                    <span className="font-semibold">{currency}{sales.reduce((sum, s) => sum + parseFloat(s.total), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Profit:</span>
                    <span className="font-semibold text-green-600">{currency}{totalProfit.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
                <h3 className="font-semibold text-foreground mb-4">Inventory Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Products:</span>
                    <span className="font-semibold">{totalProducts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Value:</span>
                    <span className="font-semibold">{currency}{totalValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Low Stock Items:</span>
                    <span className="font-semibold text-yellow-600">{lowStock}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold mb-4">Transaction Details</h3>
              <div className="flex gap-2 mb-4">
                <Input placeholder="Search customer..." value={reportFilter.customer} onChange={(e) => setReportFilter({ ...reportFilter, customer: e.target.value })} className="w-48" />
                <Input type="date" value={reportFilter.startDate} onChange={(e) => setReportFilter({ ...reportFilter, startDate: e.target.value })} className="w-40" placeholder="Start date" />
                <Input type="date" value={reportFilter.endDate} onChange={(e) => setReportFilter({ ...reportFilter, endDate: e.target.value })} className="w-40" placeholder="End date" />
                <Button variant="outline" onClick={() => setReportFilter({ type: "all", customer: "", startDate: "", endDate: "" })}>Clear</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Sale #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Items</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedReports.map(s => {
                      const items = JSON.parse(s.items || "[]");
                      return (
                        <tr key={s.id}>
                          <td className="px-4 py-3 text-sm font-mono">{s.sale_number}</td>
                          <td className="px-4 py-3 text-sm">{s.customer_name || "Walk-in"}</td>
                          <td className="px-4 py-3 text-sm">{items.length} item(s)</td>
                          <td className="px-4 py-3 text-sm font-semibold">{currency}{parseFloat(s.total).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm capitalize">{s.payment_method}</td>
                          <td className="px-4 py-3 text-sm">{new Date(s.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm">{new Date(s.created_at).toLocaleTimeString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalReportPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">Page {reportPage} of {totalReportPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setReportPage(p => Math.max(1, p - 1))} disabled={reportPage === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setReportPage(p => Math.min(totalReportPages, p + 1))} disabled={reportPage === totalReportPages}>Next</Button>
                  </div>
                </div>
              )}
            </div>
            <Button><Download className="w-4 h-4 mr-2" />Download Full Report</Button>
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
