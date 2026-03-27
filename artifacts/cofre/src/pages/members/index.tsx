import { useState } from "react";
import { useUsers } from "@/hooks/use-users";
import { useCreateMembershipRequest } from "@/hooks/use-requests";
import { formatMT } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Search, X } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function MembersPage() {
  const { data: users, isLoading } = useUsers();
  const createMutation = useCreateMembershipRequest();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [nome, setNome] = useState("");
  const [foto, setFoto] = useState("");
  const [saldo, setSaldo] = useState("");

  if (isLoading) return <PageLoader />;

  const filtered = users?.filter(u => u.nome.toLowerCase().includes(search.toLowerCase())) || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(saldo.replace(',', '.'));
    if (isNaN(val)) return;
    
    await createMutation.mutateAsync({
      data: {
        nome,
        foto: foto.toUpperCase().slice(0, 2),
        saldo_base: Math.round(val * 100)
      }
    });
    setIsDialogOpen(false);
    setNome(""); setFoto(""); setSaldo("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Membros</h1>
          <p className="text-muted-foreground">Comunidade de investidores do cofre.</p>
        </div>
        <button 
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> Registar Adesão
        </button>
      </div>

      <div className="glass-panel rounded-2xl p-2 flex items-center gap-3">
        <Search className="w-5 h-5 text-muted-foreground ml-2" />
        <input 
          type="text"
          placeholder="Buscar membro..."
          className="bg-transparent border-none focus:outline-none text-white w-full py-2 placeholder:text-muted-foreground"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((user, i) => (
          <Link key={user.id} href={`/membros/${user.id}`} className="block">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel rounded-2xl p-5 hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                    {user.foto}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{user.nome}</h3>
                    <StatusBadge status={user.status} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo Base</span>
                  <span className="font-mono text-white font-medium">{formatMT(user.saldo_base)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lucro Acumulado</span>
                  <span className="font-mono text-success font-medium">{formatMT(user.lucro_acumulado)}</span>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Nenhum membro encontrado.
          </div>
        )}
      </div>

      {/* Create Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel w-full max-w-md rounded-2xl p-6 relative"
          >
            <button onClick={() => setIsDialogOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-2">Pedido de Adesão</h2>
            <p className="text-muted-foreground text-sm mb-6">Submeta os dados para a administração aprovar a sua entrada no Cofre.</p>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Nome Completo</label>
                <input required value={nome} onChange={e=>setNome(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Ex: João Silva" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Iniciais (2 letras)</label>
                <input required maxLength={2} value={foto} onChange={e=>setFoto(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary uppercase" placeholder="JS" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Aporte Inicial Proposto (MT)</label>
                <input required type="text" value={saldo} onChange={e=>setSaldo(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" placeholder="1000.00" />
              </div>
              
              <button 
                type="submit" 
                disabled={createMutation.isPending}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold mt-6 hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending ? "Submetendo..." : "Submeter Adesão"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

