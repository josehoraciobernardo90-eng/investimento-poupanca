import { useState } from "react";
import { useUsers, useDeleteUser } from "@/hooks/use-users";
import { formatMT } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Search, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

export default function MembersPage() {
  const { data: users, isLoading } = useUsers();
  const deleteMut = useDeleteUser();
  const [search, setSearch] = useState("");
  const [userToDelete, setUserToDelete] = useState<{ id: string, nome: string } | null>(null);

  if (isLoading) return <PageLoader />;

  const filtered = users?.filter(u => u.nome.toLowerCase().includes(search.toLowerCase())) || [];

  const handleDelete = async () => {
    if (userToDelete) {
      await deleteMut.mutateAsync({ userId: userToDelete.id });
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Membros</h1>
          <p className="text-muted-foreground">Comunidade de investidores do cofre.</p>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout" initial={false}>
          {filtered.map((user, i) => (
            <motion.div 
              key={`mem-${user.id}`}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              className="relative group"
            >
              <Link href={`/membros/${user.id}`} className="block">
                <div className="glass-panel rounded-2xl p-5 hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 cursor-pointer group-hover:bg-white/5">
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
                </div>
              </Link>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setUserToDelete({ id: user.id, nome: user.nome });
                }}
                className="absolute top-4 right-4 p-2 bg-destructive/10 text-destructive rounded-xl opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-white transition-all duration-200 z-10"
                title="Eliminar Membro"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Nenhum membro encontrado.
          </div>
        )}
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent className="glass-panel border-white/10 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar Eliminação</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem a certeza que deseja eliminar o membro <span className="text-white font-bold">{userToDelete?.nome}</span>? Esta acção não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 text-white border-white/10 rounded-xl hover:bg-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Confirmar Eliminação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
