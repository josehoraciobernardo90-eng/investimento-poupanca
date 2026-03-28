import { useState } from "react";
import { useUsers } from "@/hooks/use-users";
import { formatMT } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Search } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { MembershipRegistrationModal } from "@/components/members/MembershipRegistrationModal";

export default function MembersPage() {
  const { data: users, isLoading } = useUsers();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) return <PageLoader />;

  const filtered = users?.filter(u => u.nome.toLowerCase().includes(search.toLowerCase())) || [];

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

      <MembershipRegistrationModal isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </div>
  );
}

