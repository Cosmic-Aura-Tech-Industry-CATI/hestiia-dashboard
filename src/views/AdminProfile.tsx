'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  KeyRound,
  Shield,
  UserPlus,
  Clock,
  Lock,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  RefreshCw,
} from 'lucide-react';
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

  // New staff user form (superadmin/admin only)
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const { success, error } = useToast();

  const formatRole = (role?: string): 'ADMIN' | 'STAFF' => {
    if (!role) return 'STAFF';
    const r = role.toUpperCase();
    if (r === 'SUPERADMIN' || r === 'ADMIN') return 'ADMIN';
    return 'STAFF';
  };

  const isSuperAdmin =
    currentUser?.role?.toUpperCase() === 'SUPERADMIN' ||
    currentUser?.role?.toUpperCase() === 'ADMIN';

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const meRes = await adminApi.getMe();
      if (meRes.success && meRes.user) {
        setCurrentUser(meRes.user);

        if (meRes.user.role?.toUpperCase() === 'SUPERADMIN') {
          const usersRes = await adminApi.getUsers();
          if (usersRes.success && usersRes.users) {
            setTeamUsers(usersRes.users);
          }
        }
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
      if (err.status === 404) {
        error(
          'Direct password update endpoint is not mounted on the backend. Please use the Forgot Password flow on the Sign-In page.'
        );
      } else {
        error(err.message || 'Failed to change password.');
      }
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
        username: newStaffUsername || newStaffEmail.split('@')[0],
        password: newStaffPassword,
        role: newStaffRole,
        status: 'ACTIVE',
      });

      if (res.success && res.user) {
        success(res.message || 'Staff member created successfully.');
        setTeamUsers((prev) => [res.user, ...prev]);
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

  const handleToggleStatus = async (user: AdminUser) => {
    const newStatus = (user.status || (user.active ? 'ACTIVE' : 'INACTIVE')) === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setUpdatingUserId(user.id);
      const res = await adminApi.updateUserStatus(user.id, newStatus);
      if (res.success && res.user) {
        success(res.message || `User status updated to ${newStatus}.`);
        setTeamUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus, active: newStatus === 'ACTIVE' } : u))
        );
      }
    } catch (err: any) {
      error(err.message || 'Failed to update user status.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      error('Security constraint: You cannot delete your own account.');
      return;
    }

    if (!confirm(`Are you sure you want to delete staff account '${user.name}' (${user.email})?`)) {
      return;
    }

    try {
      setUpdatingUserId(user.id);
      const res = await adminApi.deleteUser(user.id);
      if (res.success) {
        success(res.message || 'Staff account deleted.');
        setTeamUsers((prev) => prev.filter((u) => u.id !== user.id));
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete staff account.');
    } finally {
      setUpdatingUserId(null);
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
                {formatRole(currentUser.role)}
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
                className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold uppercase tracking-wider text-xs shadow-gold-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isChangingPass ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Superadmin Team Roster & Provisioning */}
      {isSuperAdmin && (
        <div className="space-y-6 pt-6 border-t border-charcoal-border">
          <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md space-y-4">
            <h2 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-gold" />
              <span>Provision New Restaurant Staff Account</span>
            </h2>

            <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
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
                <label className="block text-beige mb-1 font-medium">Email Address</label>
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

              <div>
                <label className="block text-beige mb-1 font-medium">Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as 'ADMIN' | 'STAFF')}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="STAFF">Staff</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="w-full py-2 px-3 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold uppercase tracking-wider text-xs shadow-gold-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingUser ? 'Creating...' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>

          {/* Active Staff List */}
          <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-charcoal-border bg-charcoal/60 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-warmwhite">Active Staff Roster</h3>
                <p className="text-[11px] text-beige-muted mt-0.5">
                  Superadmin view: Control authorizations, activate/suspend roles and delete accounts
                </p>
              </div>
              <button
                type="button"
                onClick={fetchProfile}
                className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border text-beige hover:text-gold transition-colors"
                title="Refresh Roster"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-charcoal-border bg-charcoal/40 text-beige-muted uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-semibold">Staff Name</th>
                    <th className="py-3 px-4 font-semibold">Username / Email</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-border/60">
                  {teamUsers.map((u) => {
                    const status = u.status || (u.active ? 'ACTIVE' : 'INACTIVE');
                    const isSelf = u.id === currentUser.id;
                    const isBusy = updatingUserId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-charcoal/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-warmwhite">
                          <div className="flex items-center space-x-2">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-gold/20 text-gold font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-beige">
                          <span className="font-mono text-warmwhite">{u.username}</span> • {u.email}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                              formatRole(u.role) === 'ADMIN'
                                ? 'bg-gold/15 border-gold/40 text-gold'
                                : 'bg-sky-950/40 border-sky-600/40 text-sky-300'
                            }`}
                          >
                            {formatRole(u.role)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                              status === 'ACTIVE'
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center space-x-2">
                            <button
                              type="button"
                              disabled={isSelf || isBusy}
                              onClick={() => handleToggleStatus(u)}
                              title={status === 'ACTIVE' ? 'Deactivate account' : 'Activate account'}
                              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                status === 'ACTIVE'
                                  ? 'bg-rose-950/30 border-rose-800/40 text-rose-300 hover:bg-rose-900/50'
                                  : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/50'
                              }`}
                            >
                              {status === 'ACTIVE' ? (
                                <ToggleRight className="w-4 h-4" />
                              ) : (
                                <ToggleLeft className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={isSelf || isBusy}
                              onClick={() => handleDeleteUser(u)}
                              title="Delete account"
                              className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border text-beige-muted hover:text-rose-400 hover:border-rose-600/50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
