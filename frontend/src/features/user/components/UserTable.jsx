import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';

export const UserTable = ({
  users,
  currentPage,
  limit,
  roleVariant,
  roleLabel,
  onEdit,
  onDelete,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50">
          <TableHead className="w-12 text-center">No.</TableHead>
          <TableHead>Nama</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="w-20"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u, index) => (
          <TableRow
            key={u.id}
            className="hover:bg-slate-50"
          >
            <TableCell className="text-center text-slate-500 text-sm">{(currentPage - 1) * limit + index + 1}</TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-700 font-bold text-xs">
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium text-slate-900">{u.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-sm text-slate-600">{u.email}</TableCell>
            <TableCell>
              <Badge variant={roleVariant(u.role)} title="Role menentukan akses menu dan fitur">
                {roleLabel(u.role)}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Edit"
                  onClick={(e) => { e.stopPropagation(); onEdit(u.id); }}
                >
                  <Pencil className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Hapus"
                  onClick={(e) => onDelete(u, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
