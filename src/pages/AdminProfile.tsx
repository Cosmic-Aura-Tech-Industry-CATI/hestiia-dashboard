import React, { useState, useEffect } from 'react';
import { UserCheck, KeyRound, Shield, UserPlus, Clock, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { AdminUser } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { useToast } from '../components/common/ToastContext';

export const AdminProfile: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [teamUsers, setTeamUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // New staff user form (superadmin)
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'manager' | 'staff'>('staff');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const { success, error } = useToast();

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const meRes = await adminApi.getMe();
      if (meRes.success) setCurrentUser(meRes.user);

      if (meRes.user?.role === 'superadmin') {
        const usersRes = await adminApi.getUsers();
        if (usersRes.success) setTeamUsers(usersRes.users);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch staff profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 8) {
      error('Password must be at least 8 characters.');
      return;
    }

    try {
      setIsChangingPass(true);
      const res = await adminApi.changePassword({ currentPassword, newPassword });
      if (res.success) {
        success('Your security password has been updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      error(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingUser(true);
      const res = await adminApi.createUser({
        name: newStaffName,
        email: newStaffEmail,
        username: newStaffUsername,
        password: newStaffPassword,
        role: newStaffRole,
      });

      if (res.success) {
        success(res.message);
        setTeamUsers((prev) => [...prev, res.user]);
        setNewStaffName('');
        setNewStaffEmail('');
        setNewStaffUsername('');
        setNewStaffPassword('');
      }
    } catch (err: any) {
      error(err.message || 'Failed to create staff user.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  if (isLoading || !currentUser) {
    return <LoadingState message="Verifying administrative credentials..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrative Security & Staff Roster"
        subtitle="Manage personal access credentials, role authorizations, and staff team accounts"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="p-6 rounded-3xl bg-charcoal-card border border-gold/40 shadow-xl space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gold/20 border border-gold text-gold font-bold text-2xl flex items-center justify-center flex-shrink-0 shadow-gold-sm">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-warmwhite">{currentUser.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-gold/15 border border-gold/40 text-gold uppercase text-[10px] font-bold tracking-wider inline-block mt-1">
                {currentUser.role}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-charcoal-border">
            <div className="flex justify-between text-beige">
              <span>Username:</span>
              <span className="font-mono text-warmwhite">{currentUser.username}</span>
            </div>
            <div className="flex justify-between text-beige">
              <span>Email:</span>
              <span className="text-warmwhite">{currentUser.email}</span>
            </div>
            <div className="flex justify-between text-beige">
              <span>Account Status:</span>
              <span className="text-emerald-400 font-semibold">Active & Authorized</span>
            </div>
            {currentUser.lastLogin && (
              <div className="flex justify-between text-beige">
                <span>Last Session:</span>
                <span className="text-beige-muted text-[11px]">
                  {new Date(currentUser.lastLogin).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Change Password Card */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md space-y-4">
          <h2 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-gold" />
            <span>Update Security Password</span>
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-beige mb-1 font-medium">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-beige mb-1 font-medium">New Password (Min 8 chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isChangingPass}
                className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold uppercase tracking-wider text-xs shadow-gold-sm transition-all"
              >
                {isChangingPass ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Superadmin Team Roster & Provisioning */}
      {currentUser.role === 'superadmin' && (
        <div className="space-y-6 pt-6 border-t border-charcoal-border">
          <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md space-y-4">
            <h2 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-gold" />
              <span>Provision New Restaurant Staff Account</span>
            </h2>

            <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-beige mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Email</label>
                <input
                  type="email"
                  required
                  placeholder="rahul@hestiia.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Username</label>
                <input
                  type="text"
                  required
                  placeholder="rahul"
                  value={newStaffUsername}
                  onChange={(e) => setNewStaffUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="w-full py-2 px-3 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold uppercase tracking-wider text-xs shadow-gold-sm transition-all"
                >
                  {isCreatingUser ? 'Creating...' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>

          {/* Active Staff List */}
          <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-charcoal-border bg-charcoal/60">
              <h3 className="font-serif text-base font-bold text-warmwhite">Active Staff Users</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-charcoal-border bg-charcoal/40 text-beige-muted uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-semibold">Staff Name</th>
                    <th className="py-3 px-4 font-semibold">Username / Email</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-border/60">
                  {teamUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 px-4 font-semibold text-warmwhite">{u.name}</td>
                      <td className="py-3 px-4 text-beige">
                        <span className="font-mono text-warmwhite">{u.username}</span> • {u.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-full bg-charcoal border border-charcoal-border text-gold font-semibold text-[10px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-medium">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
