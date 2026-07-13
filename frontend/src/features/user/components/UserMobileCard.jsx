import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

export const UserMobileCard = ({
  user,
  roleVariant,
  roleLabel,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="p-4 hover:bg-slate-50 transition flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <span className="text-blue-700 font-bold text-sm">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate">{user.name}</p>
        <p className="text-sm text-slate-500 truncate">{user.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={roleVariant(user.role)}>{roleLabel(user.role)}</Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 lg:hidden"
          title="Edit"
          onClick={() => onEdit(user.id)}
        >
          <Pencil className="h-4 w-4 text-blue-600" />
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="h-7 w-7 p-0 lg:hidden"
          title="Hapus"
          onClick={(e) => onDelete(user, e)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
