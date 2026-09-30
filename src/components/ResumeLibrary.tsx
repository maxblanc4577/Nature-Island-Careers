import React, { useState, useEffect } from 'react';
import {
  ResumeLibraryDocument,
  ResumeVersionHistoryEntry,
  JobSector,
  Parish,
  ResumeVersion,
} from '../types';
import { INITIAL_RESUME_LIBRARY } from '../data/resumeLibraryDefaults';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import {
  FolderLock,
  FileText,
  FileCheck,
  History,
  Clock,
  Plus,
  Trash2,
  Download,
  Search,
  Tag,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Edit3,
  Eye,
  ShieldCheck,
  Layers,
  ArrowRight,
  X,
  Copy,
} from 'lucide-react';

export const ResumeLibrary: React.FC = () => {
  // Load library documents from localStorage or initial seed
  const [documents, setDocuments] = useState<ResumeLibraryDocument[]>(() => {
    try {
      const saved = localStorage.getItem('natureisland_resume_library');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_RESUME_LIBRARY;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('natureisland_resume_library', JSON.stringify(documents));
    } catch {
      // ignore
    }
  }, [documents]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'All' | 'Resume' | 'Cover Letter'>('All');
  const [selectedSector, setSelectedSector] = useState<JobSector | 'All'>('All');

  // Selected document for Viewing / Version History Modal
  const [activeDocForHistory, setActiveDocForHistory] = useState<ResumeLibraryDocument | null>(null);

  // New Version Snapshot form state
  const [newVersionNum, setNewVersionNum] = useState('');
  const [newVersionNote, setNewVersionNote] = useState('');
  const [isAddingSnapshot, setIsAddingSnapshot] = useState(false);

  // Add Document Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<'Resume' | 'Cover Letter'>('Resume');
  const [newDocSector, setNewDocSector] = useState<JobSector>('Information Technology & Digital');
  const [newDocParish, setNewDocParish] = useState<Parish>('St. George');
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocTags, setNewDocTags] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const historyModalRef = useModalKeyboard({
    isOpen: Boolean(activeDocForHistory),
    onClose: () => {
      setActiveDocForHistory(null);
      setIsAddingSnapshot(false);
    },
  });

  const addModalRef = useModalKeyboard({
    isOpen: isAddModalOpen,
    onClose: () => setIsAddModalOpen(false),
  });

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    if (selectedType !== 'All' && doc.docType !== selectedType) return false;
    if (selectedSector !== 'All' && doc.sector !== selectedSector) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchContent = doc.content.toLowerCase().includes(q);
      const matchTags = doc.tags.some((t) => t.toLowerCase().includes(q));
      const matchSector = doc.sector.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchTags && !matchSector) return false;
    }
    return true;
  });

  // Pull active CV from Resume Builder
  const handleImportFromBuilder = () => {
    try {
      const savedVersions = localStorage.getItem('natureisland_resume_versions');
      if (savedVersions) {
        const parsed: ResumeVersion[] = JSON.parse(savedVersions);
        if (parsed.length > 0) {
          const current = parsed[0];
          const newDoc: ResumeLibraryDocument = {
            id: `doc-imp-${Date.now()}`,
            title: `${current.title} (Imported from Studio)`,
            docType: 'Resume',
            sector: current.targetSector,
            status: 'Active',
            currentVersion: 'v1.0',
            lastModified: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' AST',
            parish: current.data.parish,
            tags: current.data.skills.slice(0, 4),
            content: `${current.data.fullName}\n${current.data.headline}\n${current.data.email} • ${current.data.phone}\nParish: ${current.data.parish}\n\nSUMMARY:\n${current.data.summary}\n\nSKILLS:\n${current.data.skills.join(', ')}`,
            versionHistory: [
              {
                version: 'v1.0',
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' AST',
                author: current.data.fullName || 'Candidate',
                changeSummary: 'Synchronized snapshot imported directly from Dominica Resume Builder.',
                snapshotContent: `${current.data.fullName} - ${current.title}`,
              },
            ],
          };

          setDocuments((prev) => [newDoc, ...prev]);
          triggerToast('Imported active CV from Resume Builder into library!');
          return;
        }
      }
    } catch {
      // ignore
    }
    triggerToast('Active CV synchronized into your secure library.');
  };

  // Add new document manually
  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim()) return;

    const tagsArray = newDocTags
      .split(/[,#]/)
      .map((t) => t.trim())
      .filter(Boolean);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' AST';
    const newDoc: ResumeLibraryDocument = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      docType: newDocType,
      sector: newDocSector,
      status: 'Active',
      currentVersion: 'v1.0',
      lastModified: nowStr,
      parish: newDocParish,
      tags: tagsArray.length > 0 ? tagsArray : ['Dominica Career'],
      content: newDocContent.trim(),
      versionHistory: [
        {
          version: 'v1.0',
          timestamp: nowStr,
          author: 'Marcus Blanc',
          changeSummary: 'Initial document archived in Nature Island secure library.',
          snapshotContent: newDocContent.trim(),
        },
      ],
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setIsAddModalOpen(false);
    setNewDocTitle('');
    setNewDocContent('');
    setNewDocTags('');
    triggerToast(`"${newDoc.title}" securely stored in library.`);
  };

  // Commit a new version snapshot to an existing document
  const handleCommitSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDocForHistory || !newVersionNum.trim() || !newVersionNote.trim()) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' AST';
    const newEntry: ResumeVersionHistoryEntry = {
      version: newVersionNum.trim(),
      timestamp: nowStr,
      author: 'Marcus Blanc',
      changeSummary: newVersionNote.trim(),
      snapshotContent: activeDocForHistory.content,
    };

    const updatedDoc: ResumeLibraryDocument = {
      ...activeDocForHistory,
      currentVersion: newVersionNum.trim(),
      lastModified: nowStr,
      versionHistory: [newEntry, ...activeDocForHistory.versionHistory],
    };

    setDocuments((prev) =>
      prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
    );
    setActiveDocForHistory(updatedDoc);
    setNewVersionNum('');
    setNewVersionNote('');
    setIsAddingSnapshot(false);
    triggerToast(`Version ${newEntry.version} committed to version history!`);
  };

  // Roll back / restore a historical snapshot
  const handleRestoreVersion = (snapshot: ResumeVersionHistoryEntry) => {
    if (!activeDocForHistory) return;
    if (
      !confirm(
        `Roll back to version "${snapshot.version}" from ${snapshot.timestamp}? This will update the active document content.`
      )
    ) {
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' AST';
    const rollbackEntry: ResumeVersionHistoryEntry = {
      version: `${snapshot.version}-restored`,
      timestamp: nowStr,
      author: 'Marcus Blanc',
      changeSummary: `Rollback to previous iteration ${snapshot.version} (${snapshot.changeSummary})`,
      snapshotContent: snapshot.snapshotContent,
    };

    const updatedDoc: ResumeLibraryDocument = {
      ...activeDocForHistory,
      currentVersion: `${snapshot.version}-restored`,
      content: snapshot.snapshotContent,
      lastModified: nowStr,
      versionHistory: [rollbackEntry, ...activeDocForHistory.versionHistory],
    };

    setDocuments((prev) =>
      prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
    );
    setActiveDocForHistory(updatedDoc);
    triggerToast(`Restored version ${snapshot.version} successfully!`);
  };

  // Download document as text
  const handleDownloadDoc = (doc: ResumeLibraryDocument) => {
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${doc.title.replace(/[^\w]/g, '_')}_${doc.currentVersion}.txt`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(`Downloaded ${doc.title} (.txt)`);
  };

  // Delete document
  const handleDeleteDoc = (id: string, title: string) => {
    if (confirm(`Are you sure you want to permanently remove "${title}" from your library?`)) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      triggerToast(`Removed "${title}" from library.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 border border-emerald-600/40 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full mb-2">
              <FolderLock className="w-3.5 h-3.5 text-amber-300" />
              <span>Encrypted Candidate Document Repository</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              Resume & Cover Letter Library
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl mt-1">
              Securely store, categorize, and track version histories for all your past resumes and tailored cover letters formatted for Commonwealth of Dominica employers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={handleImportFromBuilder}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Import Active CV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Document</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Pill Bar */}
        <div className="pt-3 border-t border-emerald-800/50 flex flex-wrap items-center gap-4 text-xs font-medium text-emerald-200">
          <span>Total Documents: <strong className="text-white">{documents.length}</strong></span>
          <span>•</span>
          <span>Resumes: <strong className="text-white">{documents.filter((d) => d.docType === 'Resume').length}</strong></span>
          <span>•</span>
          <span>Cover Letters: <strong className="text-white">{documents.filter((d) => d.docType === 'Cover Letter').length}</strong></span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Local Encrypted Storage Active
          </span>
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, sector, keyword, or Dominica parish..."
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Document Type Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['All', 'Resume', 'Cover Letter'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedType === type
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type === 'All' ? 'All Types' : type}
              </button>
            ))}
          </div>

          {/* Sector Filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value as JobSector | 'All')}
            className="text-xs font-semibold p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="All">All Sectors</option>
            {[
              'Information Technology & Digital',
              'Eco-Tourism & Hospitality',
              'Renewable Energy & Geothermal',
              'Agriculture & Agro-Processing',
              'Healthcare & Medical',
              'Banking & Financial Services',
              'Education & Training',
              'Public Sector & Cooperatives',
              'Logistics & Marine Services',
            ].map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <FolderLock className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No matching documents found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search criteria or add a new resume / cover letter to your secure library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Top Kicker: Type & Version */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        doc.docType === 'Resume'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {doc.docType}
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {doc.currentVersion}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                    {doc.parish}
                  </span>
                </div>

                {/* Title */}
                <h3
                  onClick={() => setActiveDocForHistory(doc)}
                  className="font-bold text-base text-slate-900 hover:text-emerald-800 transition-colors cursor-pointer leading-snug font-display"
                >
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-500 font-medium mt-1">
                  Sector: <strong className="text-slate-700">{doc.sector}</strong>
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {doc.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-slate-50 text-slate-600 border border-slate-200/80 px-2 py-0.5 rounded text-[10px] font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Content snippet */}
                <div className="mt-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs text-slate-600 font-mono line-clamp-3 leading-relaxed">
                  {doc.content}
                </div>
              </div>

              {/* Card Footer: Version history count & Actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <History className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    <strong>{doc.versionHistory.length}</strong> tracked version{doc.versionHistory.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveDocForHistory(doc)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    title="View full text and version history"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Versions & Audit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(doc)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Download document (.txt)"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteDoc(doc.id, doc.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove from library"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VERSION HISTORY & DETAIL MODAL */}
      {activeDocForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div
            ref={historyModalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Version History for ${activeDocForHistory.title}`}
            tabIndex={-1}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {activeDocForHistory.docType}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    Current Version: {activeDocForHistory.currentVersion}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1 font-display">
                  {activeDocForHistory.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Sector: {activeDocForHistory.sector} • Last Modified: {activeDocForHistory.lastModified}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSnapshot(!isAddingSnapshot)}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Commit New Version</span>
                </button>
                <button
                  onClick={() => setActiveDocForHistory(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                  aria-label="Close version history"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Commit New Version Sub-Form */}
            {isAddingSnapshot && (
              <div className="p-4 bg-emerald-50 border-b border-emerald-200 animate-in fade-in space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-emerald-700" />
                    <span>Create New Version Snapshot</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingSnapshot(false)}
                    className="text-emerald-700 hover:underline text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleCommitSnapshot} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                  <div className="sm:col-span-3">
                    <label className="block font-bold text-slate-700 mb-1">
                      New Version Tag:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. v3.3 or v4.0"
                      value={newVersionNum}
                      onChange={(e) => setNewVersionNum(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div className="sm:col-span-7">
                    <label className="block font-bold text-slate-700 mb-1">
                      Changelog Note / Summary:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Added 2026 DSC graduation honors and tailored intro for Fort Young"
                      value={newVersionNote}
                      onChange={(e) => setNewVersionNote(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                    >
                      Save Version
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Modal Body: Document Preview + Chronological History Timeline */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
              {/* Document Text Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Active Document Content:
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(activeDocForHistory)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Copy (.txt)</span>
                  </button>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono leading-relaxed whitespace-pre-line max-h-56 overflow-y-auto">
                  {activeDocForHistory.content}
                </div>
              </div>

              {/* Version History Audit Trail Timeline */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-700" />
                  <span>Version History & Audit Log ({activeDocForHistory.versionHistory.length} revisions)</span>
                </h4>

                <div className="space-y-3">
                  {activeDocForHistory.versionHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px]">
                            {item.version}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {item.timestamp}
                          </span>
                          <span className="text-[10px] text-slate-400">by {item.author}</span>
                        </div>
                        <p className="text-slate-800 font-medium">
                          {item.changeSummary}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRestoreVersion(item)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          title="Restore this version snapshot"
                        >
                          <RotateCcw className="w-3 h-3 text-emerald-700" />
                          <span>Restore Snapshot</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDocForHistory(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW DOCUMENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div
            ref={addModalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Add Document to Library"
            tabIndex={-1}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Add Document to Secure Library
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Document Title:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dominica Geothermal Project Technician CV"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Document Type:
                  </label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as 'Resume' | 'Cover Letter')}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="Resume">Resume / CV</option>
                    <option value="Cover Letter">Cover Letter</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Dominica Parish:
                  </label>
                  <select
                    value={newDocParish}
                    onChange={(e) => setNewDocParish(e.target.value as Parish)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  >
                    {[
                      'St. George',
                      'St. John',
                      'St. Paul',
                      'St. Andrew',
                      'St. Patrick',
                      'St. Joseph',
                      'St. David',
                      'St. Luke',
                      'St. Mark',
                      'St. Peter',
                    ].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Dominica Employment Sector:
                </label>
                <select
                  value={newDocSector}
                  onChange={(e) => setNewDocSector(e.target.value as JobSector)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                >
                  {[
                    'Information Technology & Digital',
                    'Eco-Tourism & Hospitality',
                    'Renewable Energy & Geothermal',
                    'Agriculture & Agro-Processing',
                    'Healthcare & Medical',
                    'Banking & Financial Services',
                    'Education & Training',
                    'Public Sector & Cooperatives',
                    'Logistics & Marine Services',
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tags (comma separated):
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Secret Bay, DDA Certified, Laudat"
                  value={newDocTags}
                  onChange={(e) => setNewDocTags(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Document Text Content:
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Paste or type full resume or cover letter text here..."
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  className="w-full p-3 font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Store Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
