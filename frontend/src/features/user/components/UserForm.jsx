import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

export const UserForm = ({
  form,
  onChange,
  onSubmit,
  isPending,
  isEditMode,
  error,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Nama <span className="text-red-500">*</span></Label>
        <Input
          id="name"
          name="name"
          placeholder="Nama lengkap"
          value={form.name}
          onChange={onChange}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
        <Input
          id="email"
          name="email"
          placeholder="email@kampus.ac.id"
          value={form.email}
          onChange={onChange}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
          value={form.role}
          onChange={onChange}
        >
          <option value="DOSEN">Dosen</option>
          <option value="ADMIN">Admin</option>
          <option value="MAHASISWA">Mahasiswa</option>
        </select>
        <p className="text-xs text-gray-500">Role menentukan akses menu dan fitur.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">
          {isEditMode ? 'Password Baru' : 'Password '}
          {!isEditMode && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id="password"
          name="password"
          placeholder={isEditMode ? '*** (Kosongkan bila tidak ingin diubah)' : 'Minimal 8 karakter (sesuaikan kebijakan)'}
          type="password"
          value={form.password}
          onChange={onChange}
          required={!isEditMode}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Simpan')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Batal
        </Button>
      </div>
    </form>
  );
};
