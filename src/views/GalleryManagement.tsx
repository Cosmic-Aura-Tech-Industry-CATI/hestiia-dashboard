'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  X,
  Search,
  UploadCloud,
  Eye,
  EyeOff,
  FolderKanban,
  ShieldCheck,
  Clock,
  XCircle,
  Archive,
  History,
  Lock,
  Globe,
  RotateCcw,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { getCachedAuthUser, isStaffRole } from '../services/apiClient';
import {
  AdminUser,
  GalleryMedia,
  GallerySection,
  MediaModerationRecord,
  MediaSource,
  MediaVisibility,
  ModerationStatus,
  PublicationStatus,
} from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/ToastContext';

type GalleryTab = 'photos' | 'moderation' | 'sections';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function getPublicationBadge(status: PublicationStatus) {
  if (status === 'published') {
    return 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40';
  }
  if (status === 'archived') {
    return 'bg-zinc-800/80 text-zinc-300 border-zinc-600/60';
  }
  return 'bg-amber-950/70 text-amber-300 border-amber-600/40';
}

function getModerationBadge(status: ModerationStatus) {
  if (status === 'approved') return 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40';
  if (status === 'rejected') return 'bg-rose-950/70 text-rose-300 border-rose-600/40';
  if (status === 'removed') return 'bg-zinc-800/80 text-zinc-300 border-zinc-600/60';
  return 'bg-amber-950/70 text-amber-300 border-amber-600/40';
}

export const GalleryManagement: React.FC = () => {
  const currentUser = getCachedAuthUser<AdminUser>();
  const isStaff = isStaffRole(currentUser?.role);
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<GalleryTab>('photos');

  // Shared Sections State
  const [sections, setSections] = useState<GallerySection[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(true);

  // Tab 1: Photos State
  const [photos, setPhotos] = useState<GalleryMedia[]>([]);
  const [photosTotal, setPhotosTotal] = useState(0);
  const [photosPage, setPhotosPage] = useState(1);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | PublicationStatus>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | MediaSource>('all');
  const [updatingPhotoId, setUpdatingPhotoId] = useState<string | null>(null);

  // Upload Official Photo Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [uploadForm, setUploadForm] = useState({
    title: '',
    caption: '',
    description: '',
    altText: '',
    sectionId: '',
    publicationStatus: 'published' as PublicationStatus,
    visibility: 'public' as MediaVisibility,
    displayOrder: 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Photo Metadata Modal State
  const [editingPhoto, setEditingPhoto] = useState<GalleryMedia | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    caption: '',
    description: '',
    altText: '',
    sectionId: '',
    displayOrder: 0,
    visibility: 'public' as MediaVisibility,
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Photo Confirmation
  const [deletingPhoto, setDeletingPhoto] = useState<GalleryMedia | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  // Tab 2: Customer Moderation State
  const [submissions, setSubmissions] = useState<GalleryMedia[]>([]);
  const [submissionsTotal, setSubmissionsTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [moderationFilter, setModerationFilter] = useState<'all' | ModerationStatus>('pending');
  const [isLoadingModeration, setIsLoadingModeration] = useState(true);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  // Reject/Remove Reason Modal
  const [reasonModal, setReasonModal] = useState<{
    submission: GalleryMedia;
    action: 'rejected' | 'removed';
  } | null>(null);
  const [moderationReason, setModerationReason] = useState('');

  // Moderation History Modal
  const [historyModal, setHistoryModal] = useState<{
    submission: GalleryMedia;
    history: MediaModerationRecord[];
  } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Delete Customer Submission Confirmation
  const [deletingSubmission, setDeletingSubmission] = useState<GalleryMedia | null>(null);
  const [isDeletingSubmission, setIsDeletingSubmission] = useState(false);

  // Tab 3: Section Modal State
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Partial<GallerySection> | null>(null);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [deletingSection, setDeletingSection] = useState<GallerySection | null>(null);
  const [isDeletingSection, setIsDeletingSection] = useState(false);

  const sectionMap = useMemo(() => {
    const map = new Map<string, GallerySection>();
    sections.forEach((s) => {
      map.set(s.id, s);
      if (s.slug) map.set(s.slug, s);
    });
    return map;
  }, [sections]);

  const fetchSections = useCallback(async () => {
    if (isStaff) return;
    try {
      setIsLoadingSections(true);
      const res = await adminApi.getGallerySections();
      if (res.success) {
        setSections(res.sections || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load gallery sections.');
    } finally {
      setIsLoadingSections(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff]);

  const fetchPhotos = useCallback(
    async (targetPage = photosPage) => {
      if (isStaff) return;
      try {
        setIsLoadingPhotos(true);
        const res = await adminApi.getGalleryPhotos({
          section: sectionFilter !== 'all' ? sectionFilter : undefined,
          publicationStatus: statusFilter !== 'all' ? statusFilter : undefined,
          mediaSource: sourceFilter !== 'all' ? sourceFilter : undefined,
          search: searchQuery.trim() || undefined,
          page: targetPage,
          limit: 18,
        });
        if (res.success) {
          setPhotos(res.photos || []);
          setPhotosTotal(res.total || 0);
        }
      } catch (err: any) {
        error(err.message || 'Failed to load gallery photographs.');
      } finally {
        setIsLoadingPhotos(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isStaff, sectionFilter, statusFilter, sourceFilter, searchQuery, photosPage]
  );

  const fetchSubmissions = useCallback(
    async (targetPage = submissionsPage) => {
      if (isStaff) return;
      try {
        setIsLoadingModeration(true);
        const res = await adminApi.getCustomerUploads({
          moderationStatus: moderationFilter !== 'all' ? moderationFilter : undefined,
          page: targetPage,
          limit: 18,
        });
        if (res.success) {
          setSubmissions(res.submissions || []);
          setSubmissionsTotal(res.total || 0);
          if (moderationFilter === 'pending') {
            setPendingCount(res.total || 0);
          }
        }
      } catch (err: any) {
        error(err.message || 'Failed to load customer submissions.');
      } finally {
        setIsLoadingModeration(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isStaff, moderationFilter, submissionsPage]
  );

  useEffect(() => {
    if (!isStaff) {
      fetchSections();
      fetchSubmissions(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff]);

  useEffect(() => {
    if (!isStaff) {
      setPhotosPage(1);
      fetchPhotos(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionFilter, statusFilter, sourceFilter]);

  useEffect(() => {
    if (!isStaff) {
      setSubmissionsPage(1);
      fetchSubmissions(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moderationFilter]);

  useEffect(() => {
    return () => {
      if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    };
  }, [uploadPreview]);

  const publishedCount = useMemo(
    () => photos.filter((p) => p.publicationStatus === 'published').length,
    [photos]
  );
  const activeSectionsCount = useMemo(
    () => sections.filter((s) => s.isActive).length,
    [sections]
  );

  // Search handlers
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhotosPage(1);
    fetchPhotos(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSectionFilter('all');
    setStatusFilter('all');
    setSourceFilter('all');
    setPhotosPage(1);
    adminApi
      .getGalleryPhotos({ page: 1, limit: 18 })
      .then((res) => {
        if (res.success) {
          setPhotos(res.photos || []);
          setPhotosTotal(res.total || 0);
        }
      })
      .catch(() => {});
  };

  // Upload handlers
  const handleOpenUpload = () => {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadFile(null);
    setUploadPreview('');
    setUploadForm({
      title: '',
      caption: '',
      description: '',
      altText: '',
      sectionId: sections[0]?.id || '',
      publicationStatus: 'published',
      visibility: 'public',
      displayOrder: photosTotal + 1,
    });
    setIsUploadOpen(true);
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      error('Invalid format. Only JPEG, PNG, and WEBP images are permitted.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      error('File size exceeds the 5MB upload limit.');
      return;
    }
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    if (!uploadForm.title) {
      setUploadForm((prev) => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      error('Please select an image file (JPEG, PNG, or WEBP) to upload.');
      return;
    }
    if (!uploadForm.title.trim()) {
      error('Photo title is required.');
      return;
    }

    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append('photo', uploadFile);
      fd.append('title', uploadForm.title.trim());
      if (uploadForm.caption.trim()) fd.append('caption', uploadForm.caption.trim());
      if (uploadForm.description.trim()) fd.append('description', uploadForm.description.trim());
      if (uploadForm.altText.trim()) fd.append('altText', uploadForm.altText.trim());
      if (uploadForm.sectionId) fd.append('sectionId', uploadForm.sectionId);
      fd.append('publicationStatus', uploadForm.publicationStatus);
      fd.append('visibility', uploadForm.visibility);
      fd.append('displayOrder', String(uploadForm.displayOrder || 0));

      const res = await adminApi.uploadGalleryPhoto(fd);
      if (res.success) {
        success(res.message || 'Official photograph uploaded successfully.');
        setIsUploadOpen(false);
        fetchPhotos(1);
        setPhotosPage(1);
      }
    } catch (err: any) {
      error(err.message || 'Failed to upload photograph.');
    } finally {
      setIsUploading(false);
    }
  };

  // Edit Photo handlers
  const handleOpenEdit = (photo: GalleryMedia) => {
    setEditingPhoto(photo);
    setEditForm({
      title: photo.title || '',
      caption: photo.caption || '',
      description: photo.description || '',
      altText: photo.altText || '',
      sectionId: photo.sectionId || '',
      displayOrder: photo.displayOrder ?? 0,
      visibility: photo.visibility || 'public',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;
    try {
      setIsSavingEdit(true);
      const res = await adminApi.updateGalleryPhoto(editingPhoto.id, {
        title: editForm.title.trim(),
        caption: editForm.caption.trim(),
        description: editForm.description.trim(),
        altText: editForm.altText.trim(),
        sectionId: editForm.sectionId || undefined,
        displayOrder: Number(editForm.displayOrder) || 0,
        visibility: editForm.visibility,
      });
      if (res.success) {
        success(res.message || 'Photograph updated successfully.');
        setEditingPhoto(null);
        fetchPhotos(photosPage);
      }
    } catch (err: any) {
      error(err.message || 'Failed to update photograph.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleStatusChange = async (photo: GalleryMedia, status: PublicationStatus) => {
    try {
      setUpdatingPhotoId(photo.id);
      const res = await adminApi.updateGalleryPhotoStatus(photo.id, status);
      if (res.success) {
        success(res.message || `Photo status changed to ${status}.`);
        fetchPhotos(photosPage);
      }
    } catch (err: any) {
      error(err.message || 'Failed to update publication status.');
    } finally {
      setUpdatingPhotoId(null);
    }
  };

  const handleConfirmDeletePhoto = async () => {
    if (!deletingPhoto) return;
    try {
      setIsDeletingPhoto(true);
      const res = await adminApi.deleteGalleryPhoto(deletingPhoto.id);
      if (res.success) {
        success(res.message || 'Photograph deleted successfully.');
        setDeletingPhoto(null);
        fetchPhotos(photosPage);
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete photograph.');
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  // Moderation handlers
  const handleApproveSubmission = async (sub: GalleryMedia) => {
    try {
      setModeratingId(sub.id);
      const res = await adminApi.moderateCustomerUpload(sub.id, { action: 'approved' });
      if (res.success) {
        success(res.message || 'Customer submission approved & published.');
        fetchSubmissions(submissionsPage);
        fetchPhotos(1);
      }
    } catch (err: any) {
      error(err.message || 'Failed to approve submission.');
    } finally {
      setModeratingId(null);
    }
  };

  const handleSubmitReasonModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonModal) return;
    try {
      setModeratingId(reasonModal.submission.id);
      const res = await adminApi.moderateCustomerUpload(reasonModal.submission.id, {
        action: reasonModal.action,
        reason: moderationReason.trim() || undefined,
      });
      if (res.success) {
        success(res.message || `Submission ${reasonModal.action}.`);
        setReasonModal(null);
        setModerationReason('');
        fetchSubmissions(submissionsPage);
        fetchPhotos(1);
      }
    } catch (err: any) {
      error(err.message || 'Moderation action failed.');
    } finally {
      setModeratingId(null);
    }
  };

  const handleOpenHistory = async (sub: GalleryMedia) => {
    try {
      setIsLoadingHistory(true);
      setHistoryModal({ submission: sub, history: [] });
      const res = await adminApi.getCustomerUploadById(sub.id);
      if (res.success) {
        setHistoryModal({
          submission: res.submission || sub,
          history: res.moderationHistory || [],
        });
      }
    } catch (err: any) {
      error(err.message || 'Failed to load moderation history.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleConfirmDeleteSubmission = async () => {
    if (!deletingSubmission) return;
    try {
      setIsDeletingSubmission(true);
      const res = await adminApi.deleteCustomerUpload(deletingSubmission.id);
      if (res.success) {
        success(res.message || 'Customer submission deleted.');
        setDeletingSubmission(null);
        fetchSubmissions(submissionsPage);
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete customer submission.');
    } finally {
      setIsDeletingSubmission(false);
    }
  };

  // Section handlers
  const handleOpenCreateSection = () => {
    setEditingSection({
      name: '',
      slug: '',
      description: '',
      displayOrder: sections.length + 1,
      isActive: true,
      isPublic: true,
    });
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSection = (sec: GallerySection) => {
    setEditingSection({ ...sec });
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection?.name?.trim()) {
      error('Section name is required.');
      return;
    }
    try {
      setIsSavingSection(true);
      if (editingSection.id) {
        const res = await adminApi.updateGallerySection(editingSection.id, {
          name: editingSection.name.trim(),
          description: (editingSection.description || '').trim(),
          displayOrder: Number(editingSection.displayOrder) || 0,
          isActive: Boolean(editingSection.isActive),
          isPublic: Boolean(editingSection.isPublic),
        });
        if (res.success) {
          success(res.message || 'Gallery section updated.');
          setIsSectionModalOpen(false);
          fetchSections();
        }
      } else {
        const res = await adminApi.createGallerySection({
          name: editingSection.name.trim(),
          slug: editingSection.slug?.trim() || undefined,
          description: (editingSection.description || '').trim(),
          displayOrder: Number(editingSection.displayOrder) || 0,
          isActive: editingSection.isActive ?? true,
          isPublic: editingSection.isPublic ?? true,
        });
        if (res.success) {
          success(res.message || 'Gallery section created.');
          setIsSectionModalOpen(false);
          fetchSections();
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to save gallery section.');
    } finally {
      setIsSavingSection(false);
    }
  };

  const handleConfirmDeleteSection = async () => {
    if (!deletingSection) return;
    try {
      setIsDeletingSection(true);
      const res = await adminApi.deleteGallerySection(deletingSection.id);
      if (res.success) {
        success(res.message || 'Gallery section deleted.');
        setDeletingSection(null);
        fetchSections();
      }
    } catch (err: any) {
      error(err.message || 'Cannot delete section while it contains photographs.');
    } finally {
      setIsDeletingSection(false);
    }
  };

  if (isStaff) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Ambience & Dining Gallery"
          subtitle="Manage official photography, gallery sections, and customer photo moderation"
        />
        <div className="p-8 rounded-3xl bg-charcoal-card border border-charcoal-border text-center space-y-2">
          <Lock className="w-8 h-8 text-gold mx-auto" />
          <h3 className="font-serif text-xl font-bold text-warmwhite">Manager / Admin Access Required</h3>
          <p className="text-xs text-beige max-w-md mx-auto">
            Gallery management, section configuration, and customer photo moderation are restricted to Manager and
            Superadmin accounts.
          </p>
        </div>
      </div>
    );
  }

  const totalPhotoPages = Math.max(1, Math.ceil(photosTotal / 18));
  const totalSubmissionPages = Math.max(1, Math.ceil(submissionsTotal / 18));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ambience & Dining Gallery"
        subtitle="Manage official photography, curated sections, and customer photo moderation"
        action={
          activeTab === 'sections' ? (
            <button
              onClick={handleOpenCreateSection}
              className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Section</span>
            </button>
          ) : (
            <button
              onClick={handleOpenUpload}
              className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Official Photo</span>
            </button>
          )
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border flex items-center justify-between">
          <div>
            <span className="text-[11px] text-beige-muted uppercase tracking-wider font-medium">Total Photos</span>
            <div className="font-serif text-2xl font-bold text-warmwhite mt-1">{photosTotal}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-charcoal border border-charcoal-border flex items-center justify-center text-beige-muted">
            <ImageIcon className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-charcoal-card border border-emerald-600/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-medium">Published (Page)</span>
            <div className="font-serif text-2xl font-bold text-emerald-300 mt-1">{publishedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-600/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-charcoal-card border border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-amber-300 uppercase tracking-wider font-medium">Pending Review</span>
            <div className="font-serif text-2xl font-bold text-amber-300 mt-1">{pendingCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-charcoal-card border border-gold/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gold uppercase tracking-wider font-medium">Active Sections</span>
            <div className="font-serif text-2xl font-bold text-gold mt-1">{activeSectionsCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-charcoal-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('photos')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'photos'
              ? 'bg-gold text-charcoal-950 shadow-md'
              : 'bg-charcoal-card border border-charcoal-border text-beige hover:text-warmwhite'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Official Gallery ({photosTotal})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'moderation'
              ? 'bg-gold text-charcoal-950 shadow-md'
              : 'bg-charcoal-card border border-charcoal-border text-beige hover:text-warmwhite'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Customer Moderation</span>
          {pendingCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'moderation' ? 'bg-charcoal-950 text-gold' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-gold text-charcoal-950 shadow-md'
              : 'bg-charcoal-card border border-charcoal-border text-beige hover:text-warmwhite'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Gallery Sections ({sections.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OFFICIAL GALLERY PHOTOS                            */}
      {/* ========================================================= */}
      {activeTab === 'photos' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <form onSubmit={handleSearchSubmit} className="lg:col-span-5 flex gap-2 min-w-0">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-beige-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search title, caption, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-beige-muted hover:text-warmwhite cursor-pointer"
                    title="Clear filters"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-xs font-semibold text-warmwhite hover:text-gold transition-colors cursor-pointer shrink-0"
              >
                Search
              </button>
            </form>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none cursor-pointer"
              >
                <option value="all">All Sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | PublicationStatus)}
                className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as 'all' | MediaSource)}
                className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none cursor-pointer"
              >
                <option value="all">All Sources</option>
                <option value="official">Official Only</option>
                <option value="customer">Customer Approved</option>
              </select>
            </div>
          </div>

          {isLoadingPhotos ? (
            <LoadingState message="Fetching gallery photographs..." />
          ) : photos.length === 0 ? (
            <EmptyState
              title="No Photographs Found"
              description="Upload an official restaurant photograph or adjust your active filters."
              action={
                <button
                  onClick={handleOpenUpload}
                  className="px-4 py-2.5 bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs uppercase tracking-wider rounded-xl inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload First Photo</span>
                </button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map((photo) => {
                  const sec = photo.sectionId ? sectionMap.get(photo.sectionId) : undefined;
                  return (
                    <div
                      key={photo.id}
                      className="rounded-3xl bg-charcoal-card border border-charcoal-border hover:border-gold/40 transition-all overflow-hidden shadow-lg flex flex-col justify-between"
                    >
                      <div className="relative h-52 w-full bg-charcoal overflow-hidden group">
                        <img
                          src={photo.imageUrl}
                          alt={photo.altText || photo.title || 'Restaurant Gallery'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="px-2.5 py-1 rounded-full bg-charcoal/85 backdrop-blur-md border border-charcoal-border text-gold font-semibold text-[10px] uppercase tracking-wider">
                            {sec?.name || 'General'}
                          </span>
                          {photo.mediaSource === 'customer' && (
                            <span className="px-2 py-1 rounded-full bg-sky-950/85 border border-sky-500/40 text-sky-300 font-semibold text-[10px]">
                              Customer
                            </span>
                          )}
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border capitalize backdrop-blur-md ${getPublicationBadge(
                              photo.publicationStatus
                            )}`}
                          >
                            {photo.publicationStatus}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-serif text-lg font-bold text-warmwhite leading-snug">
                              {photo.title || 'Untitled Photograph'}
                            </h3>
                            <span
                              className="text-[10px] text-beige-muted flex items-center space-x-1 shrink-0 pt-1"
                              title={`Visibility: ${photo.visibility}`}
                            >
                              {photo.visibility === 'public' ? (
                                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-beige line-clamp-2 leading-relaxed mt-1">
                            {photo.caption || photo.description || 'No caption entered.'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-charcoal-border/80 flex items-center justify-between text-xs gap-2">
                          <span className="text-beige-muted">Order: #{photo.displayOrder ?? 0}</span>

                          <div className="flex items-center space-x-1.5">
                            {photo.publicationStatus !== 'published' ? (
                              <button
                                type="button"
                                disabled={updatingPhotoId === photo.id}
                                onClick={() => handleStatusChange(photo, 'published')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/60 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                                title="Publish to public gallery"
                              >
                                {updatingPhotoId === photo.id ? '...' : 'Publish'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={updatingPhotoId === photo.id}
                                onClick={() => handleStatusChange(photo, 'archived')}
                                className="px-2.5 py-1 rounded-lg bg-charcoal border border-charcoal-border text-beige hover:text-amber-300 hover:border-amber-500/40 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                                title="Archive photograph"
                              >
                                <Archive className="w-3.5 h-3.5 inline mr-1" />
                                Archive
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(photo)}
                              className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold transition-colors cursor-pointer"
                              title="Edit Metadata"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingPhoto(photo)}
                              className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-rose-500 text-beige hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPhotoPages > 1 && (
                <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border flex items-center justify-between text-xs text-beige">
                  <div>
                    Page <strong className="text-warmwhite">{photosPage}</strong> of{' '}
                    <strong className="text-warmwhite">{totalPhotoPages}</strong> ({photosTotal} photos)
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={photosPage <= 1}
                      onClick={() => {
                        const p = photosPage - 1;
                        setPhotosPage(p);
                        fetchPhotos(p);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-charcoal-border bg-charcoal disabled:opacity-40 text-warmwhite hover:border-gold cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      disabled={photosPage >= totalPhotoPages}
                      onClick={() => {
                        const p = photosPage + 1;
                        setPhotosPage(p);
                        fetchPhotos(p);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-charcoal-border bg-charcoal disabled:opacity-40 text-warmwhite hover:border-gold cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CUSTOMER SUBMISSIONS & MODERATION                  */}
      {/* ========================================================= */}
      {activeTab === 'moderation' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {(['pending', 'approved', 'rejected', 'removed', 'all'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setModerationFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                  moderationFilter === st
                    ? 'bg-gold/15 border-gold text-gold'
                    : 'bg-charcoal-card border-charcoal-border text-beige hover:text-warmwhite'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {isLoadingModeration ? (
            <LoadingState message="Loading customer photo submissions..." />
          ) : submissions.length === 0 ? (
            <EmptyState
              title="No Customer Submissions"
              description={`No customer-uploaded photographs with status "${moderationFilter}".`}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.map((sub) => {
                  const sec = sub.sectionId ? sectionMap.get(sub.sectionId) : undefined;
                  return (
                    <div
                      key={sub.id}
                      className="rounded-3xl bg-charcoal-card border border-charcoal-border overflow-hidden shadow-lg flex flex-col justify-between"
                    >
                      <div className="relative h-52 w-full bg-charcoal overflow-hidden">
                        <img
                          src={sub.imageUrl}
                          alt={sub.caption || sub.title || 'Customer upload'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-full bg-charcoal/85 backdrop-blur-md border border-charcoal-border text-gold font-semibold text-[10px] uppercase">
                            {sec?.name || 'Customer Moments'}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border capitalize backdrop-blur-md ${getModerationBadge(
                              sub.moderationStatus
                            )}`}
                          >
                            {sub.moderationStatus}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <p className="text-xs text-warmwhite font-medium line-clamp-2">
                            {sub.caption || sub.title || 'Customer dining moment'}
                          </p>
                          {sub.rejectionReason && (
                            <p className="text-[11px] text-rose-300 mt-1.5 bg-rose-950/30 border border-rose-600/30 rounded-lg px-2.5 py-1">
                              Reason: {sub.rejectionReason}
                            </p>
                          )}
                          <p className="text-[10px] text-beige-muted mt-2">
                            Submitted: {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-charcoal-border/80 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {sub.moderationStatus !== 'approved' && (
                              <button
                                type="button"
                                disabled={moderatingId === sub.id}
                                onClick={() => handleApproveSubmission(sub)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/70 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}
                            {sub.moderationStatus !== 'rejected' && (
                              <button
                                type="button"
                                disabled={moderatingId === sub.id}
                                onClick={() => {
                                  setModerationReason('');
                                  setReasonModal({ submission: sub, action: 'rejected' });
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-950/50 border border-rose-600/40 text-rose-300 hover:bg-rose-900/60 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            )}
                            {sub.moderationStatus === 'approved' && (
                              <button
                                type="button"
                                disabled={moderatingId === sub.id}
                                onClick={() => {
                                  setModerationReason('');
                                  setReasonModal({ submission: sub, action: 'removed' });
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-amber-300 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenHistory(sub)}
                              className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold cursor-pointer"
                              title="Moderation History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingSubmission(sub)}
                              className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-rose-500 text-beige hover:text-rose-400 cursor-pointer"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalSubmissionPages > 1 && (
                <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border flex items-center justify-between text-xs text-beige">
                  <div>
                    Page <strong className="text-warmwhite">{submissionsPage}</strong> of{' '}
                    <strong className="text-warmwhite">{totalSubmissionPages}</strong> ({submissionsTotal} submissions)
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={submissionsPage <= 1}
                      onClick={() => {
                        const p = submissionsPage - 1;
                        setSubmissionsPage(p);
                        fetchSubmissions(p);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-charcoal-border bg-charcoal disabled:opacity-40 text-warmwhite hover:border-gold cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      disabled={submissionsPage >= totalSubmissionPages}
                      onClick={() => {
                        const p = submissionsPage + 1;
                        setSubmissionsPage(p);
                        fetchSubmissions(p);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-charcoal-border bg-charcoal disabled:opacity-40 text-warmwhite hover:border-gold cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: GALLERY SECTIONS                                   */}
      {/* ========================================================= */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          {isLoadingSections ? (
            <LoadingState message="Loading gallery sections..." />
          ) : sections.length === 0 ? (
            <EmptyState
              title="No Gallery Sections Found"
              description="Create sections to organize your restaurant photography."
              action={
                <button
                  onClick={handleOpenCreateSection}
                  className="px-4 py-2 bg-gold text-charcoal-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Create Section
                </button>
              }
            />
          ) : (
            <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4 font-semibold">Section Name</th>
                      <th className="py-3.5 px-4 font-semibold">Slug</th>
                      <th className="py-3.5 px-4 font-semibold">Order</th>
                      <th className="py-3.5 px-4 font-semibold">Visibility</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-border/60">
                    {sections.map((sec) => (
                      <tr key={sec.id} className="hover:bg-charcoal/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-warmwhite text-sm">{sec.name}</div>
                          {sec.description && <div className="text-[11px] text-beige line-clamp-1">{sec.description}</div>}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gold">{sec.slug}</td>
                        <td className="py-3.5 px-4 text-beige">#{sec.displayOrder}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                              sec.isPublic
                                ? 'bg-sky-950/50 text-sky-300 border-sky-600/40'
                                : 'bg-zinc-800/70 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            <Globe className="w-3 h-3" />
                            <span>{sec.isPublic ? 'Public' : 'Private'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                              sec.isActive
                                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-600/40'
                                : 'bg-zinc-800/70 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            <span>{sec.isActive ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEditSection(sec)}
                              className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold transition-colors cursor-pointer"
                              title="Edit Section"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingSection(sec)}
                              className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-rose-500 text-beige hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete Section"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: UPLOAD OFFICIAL PHOTO (multipart/form-data)        */}
      {/* ========================================================= */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsUploadOpen(false)} />
          <div className="relative w-full max-w-xl bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto animate-scaleUp text-xs space-y-4">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-2xl font-bold text-warmwhite">Upload Official Photograph</h2>
              <p className="text-beige text-[11px] mt-0.5">
                Uploads directly to restaurant gallery storage (JPEG, PNG, WEBP up to 5MB).
              </p>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              {/* File Drop / Preview */}
              <div className="p-3 rounded-2xl bg-charcoal border border-charcoal-border flex flex-col sm:flex-row items-center gap-4">
                <div className="w-28 h-24 rounded-xl bg-charcoal-card border border-charcoal-border overflow-hidden flex items-center justify-center shrink-0">
                  {uploadPreview ? (
                    <img src={uploadPreview} alt="Upload preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-beige-muted opacity-60" />
                  )}
                </div>
                <div className="flex-1 w-full space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFilePick}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-charcoal-card border border-gold/40 hover:border-gold text-gold font-semibold inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploadFile ? 'Change Image File' : 'Select Image File *'}</span>
                  </button>
                  <p className="text-[11px] text-beige-muted truncate">
                    {uploadFile ? `${uploadFile.name} (${(uploadFile.size / 1024).toFixed(0)} KB)` : 'No file selected'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Title *</label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    placeholder="e.g. Candlelit Dining Hall"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Gallery Section</label>
                  <select
                    value={uploadForm.sectionId}
                    onChange={(e) => setUploadForm({ ...uploadForm, sectionId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Caption</label>
                  <input
                    type="text"
                    maxLength={500}
                    placeholder="Short display caption..."
                    value={uploadForm.caption}
                    onChange={(e) => setUploadForm({ ...uploadForm, caption: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Alt Text (SEO / A11y)</label>
                  <input
                    type="text"
                    placeholder="Descriptive alt text..."
                    value={uploadForm.altText}
                    onChange={(e) => setUploadForm({ ...uploadForm, altText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  placeholder="Detailed ambience description..."
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Status</label>
                  <select
                    value={uploadForm.publicationStatus}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, publicationStatus: e.target.value as PublicationStatus })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Visibility</label>
                  <select
                    value={uploadForm.visibility}
                    onChange={(e) => setUploadForm({ ...uploadForm, visibility: e.target.value as MediaVisibility })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={uploadForm.displayOrder}
                    onChange={(e) => setUploadForm({ ...uploadForm, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-charcoal-border">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige hover:text-warmwhite cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT PHOTO METADATA                                */}
      {/* ========================================================= */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setEditingPhoto(null)} />
          <div className="relative w-full max-w-lg bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto animate-scaleUp text-xs space-y-4">
            <button
              onClick={() => setEditingPhoto(null)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-2xl font-bold text-warmwhite">Edit Photograph Metadata</h2>

            <div className="h-40 w-full rounded-2xl overflow-hidden bg-charcoal border border-charcoal-border">
              <img
                src={editingPhoto.imageUrl}
                alt={editingPhoto.title || 'Preview'}
                className="w-full h-full object-cover"
              />
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Title</label>
                  <input
                    type="text"
                    maxLength={150}
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Section</label>
                  <select
                    value={editForm.sectionId}
                    onChange={(e) => setEditForm({ ...editForm, sectionId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Caption</label>
                <input
                  type="text"
                  maxLength={500}
                  value={editForm.caption}
                  onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Alt Text</label>
                  <input
                    type="text"
                    value={editForm.altText}
                    onChange={(e) => setEditForm({ ...editForm, altText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Visibility</label>
                  <select
                    value={editForm.visibility}
                    onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value as MediaVisibility })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.displayOrder}
                    onChange={(e) => setEditForm({ ...editForm, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-charcoal-border">
                <button
                  type="button"
                  onClick={() => setEditingPhoto(null)}
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige hover:text-warmwhite cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REJECT / REMOVE REASON                             */}
      {/* ========================================================= */}
      {reasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setReasonModal(null)} />
          <div className="relative w-full max-w-md bg-charcoal-card border border-rose-500/40 rounded-3xl p-6 shadow-2xl z-10 text-xs space-y-4">
            <h3 className="font-serif text-xl font-bold text-warmwhite capitalize">
              {reasonModal.action === 'rejected' ? 'Reject Customer Photo' : 'Remove Approved Photo'}
            </h3>
            <form onSubmit={handleSubmitReasonModeration} className="space-y-3">
              <div>
                <label className="block text-beige mb-1 font-medium">Moderation Reason (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Blurry image, inappropriate content, off-topic..."
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReasonModal(null)}
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige hover:text-warmwhite cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={moderatingId === reasonModal.submission.id}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  Confirm {reasonModal.action}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MODERATION HISTORY                                 */}
      {/* ========================================================= */}
      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setHistoryModal(null)} />
          <div className="relative w-full max-w-md bg-charcoal-card border border-gold/40 rounded-3xl p-6 shadow-2xl z-10 text-xs space-y-4">
            <button
              onClick={() => setHistoryModal(null)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-xl font-bold text-warmwhite">Moderation Audit History</h3>
            {isLoadingHistory ? (
              <LoadingState message="Loading audit trail..." />
            ) : historyModal.history.length === 0 ? (
              <p className="text-beige-muted py-4 text-center">No moderation actions recorded yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {historyModal.history.map((h) => (
                  <div key={h.id} className="p-3 rounded-xl bg-charcoal border border-charcoal-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase text-gold">{h.action}</span>
                      <span className="text-[10px] text-beige-muted">
                        {new Date(h.reviewedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-beige">Reviewed by: {h.reviewedBy}</div>
                    {h.reason && <div className="text-rose-300">Reason: {h.reason}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE / EDIT SECTION                              */}
      {/* ========================================================= */}
      {isSectionModalOpen && editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsSectionModalOpen(false)} />
          <div className="relative w-full max-w-md bg-charcoal-card border border-gold/40 rounded-3xl p-6 shadow-2xl z-10 text-xs space-y-4">
            <button
              onClick={() => setIsSectionModalOpen(false)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-bold text-warmwhite">
              {editingSection.id ? 'Edit Gallery Section' : 'Create Gallery Section'}
            </h3>

            <form onSubmit={handleSaveSection} className="space-y-3">
              <div>
                <label className="block text-beige mb-1 font-medium">Section Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Private Dining Lounges"
                  value={editingSection.name || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              {!editingSection.id && (
                <div>
                  <label className="block text-beige mb-1 font-medium">Slug (Optional, auto-generated)</label>
                  <input
                    type="text"
                    placeholder="e.g. private-dining"
                    value={editingSection.slug || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-gold font-mono focus:border-gold focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-beige mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={editingSection.description || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={editingSection.displayOrder ?? 0}
                  onChange={(e) => setEditingSection({ ...editingSection, displayOrder: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSection.isActive ?? true}
                    onChange={(e) => setEditingSection({ ...editingSection, isActive: e.target.checked })}
                    className="rounded bg-charcoal border-charcoal-border text-gold"
                  />
                  <span className="text-warmwhite">Active</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSection.isPublic ?? true}
                    onChange={(e) => setEditingSection({ ...editingSection, isPublic: e.target.checked })}
                    className="rounded bg-charcoal border-charcoal-border text-gold"
                  />
                  <span className="text-warmwhite">Visible on Website</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-charcoal-border">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige hover:text-warmwhite cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSection}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {isSavingSection ? 'Saving...' : 'Save Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmations */}
      <ConfirmDialog
        isOpen={Boolean(deletingPhoto)}
        title="Delete Photograph"
        message={`Are you sure you want to permanently delete "${deletingPhoto?.title || 'this photograph'}"? Its cloud storage asset will also be removed.`}
        confirmLabel="Delete Photo"
        isDestructive={true}
        isLoading={isDeletingPhoto}
        onConfirm={handleConfirmDeletePhoto}
        onCancel={() => setDeletingPhoto(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingSubmission)}
        title="Delete Customer Submission"
        message="Are you sure you want to permanently delete this customer photo submission and its storage asset?"
        confirmLabel="Delete Submission"
        isDestructive={true}
        isLoading={isDeletingSubmission}
        onConfirm={handleConfirmDeleteSubmission}
        onCancel={() => setDeletingSubmission(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingSection)}
        title="Delete Gallery Section"
        message={`Are you sure you want to delete section "${deletingSection?.name}"? Deletion is blocked if photos are still assigned to it.`}
        confirmLabel="Delete Section"
        isDestructive={true}
        isLoading={isDeletingSection}
        onConfirm={handleConfirmDeleteSection}
        onCancel={() => setDeletingSection(null)}
      />
    </div>
  );
};
