'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Link,
  Copy,
  Check,
  Calendar,
  Share2,
  ExternalLink,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  RotateCw,
  Ban,
} from 'lucide-react';
import { usePractice } from '@/context/PracticeContext';
import { AssessmentInvitation } from '@/repositories/types';
import { maskToken } from '@/lib/hashUtils';

interface ClinicianInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicianInvitationModal: React.FC<ClinicianInvitationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { patient, language, repository, clinicianUser } = usePractice();
  const bn = language === 'bn';

  const [invitations, setInvitations] = useState<AssessmentInvitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [expiresDays, setExpiresDays] = useState<number>(14);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [latestCreated, setLatestCreated] = useState<AssessmentInvitation | null>(null);

  const loadInvitations = async () => {
    if (!patient?.id) return;
    try {
      setLoading(true);
      const list = await repository.getAssessmentInvitations(patient.id);
      setInvitations(list);
    } catch (err) {
      console.error('Failed to load assessment invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && patient?.id) {
      loadInvitations();
    }
  }, [isOpen, patient?.id]);

  if (!isOpen || !patient) return null;

  const getFullUrl = (token: string) => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    // Account for GitHub Pages basePath if applicable
    const pathname = window.location.pathname;
    const basePath = pathname.includes('/Diet-Chart-Software') ? '/Diet-Chart-Software' : '';
    return `${origin}${basePath}/intake/?token=${token}`;
  };

  const handleCreateInvitation = async () => {
    try {
      setCreating(true);
      const newInv = await repository.createAssessmentInvitation(
        patient.id,
        clinicianUser,
        expiresDays
      );
      setLatestCreated(newInv);
      await loadInvitations();
    } catch (err: any) {
      console.error('Failed to create invitation:', err);
      alert(err?.message || 'Failed to create assessment invitation');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (token: string) => {
    const url = getFullUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const shareViaWhatsApp = (token: string) => {
    const url = getFullUrl(token);
    const message = bn
      ? `আসসালামু আলাইকুম ${patient.name}, আপনার পুষ্টি পরামর্শের পূর্বে দয়া করে এই নিরাপদ লিংকে ক্লিক করে আপনার তথ্যগুলো পূরণ করুন: ${url}`
      : `Dear ${patient.name}, please complete your pre-consultation functional nutrition intake questionnaire here: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm(bn ? 'আপনি কি নিশ্চিত যে এই ইনভাইটেশনটি বাতিল করতে চান?' : 'Are you sure you want to revoke this invitation link?')) {
      return;
    }
    try {
      await repository.revokeAssessmentInvitation(invitationId, clinicianUser);
      if (latestCreated?.id === invitationId) {
        setLatestCreated(null);
      }
      await loadInvitations();
    } catch (err: any) {
      console.error('Failed to revoke invitation:', err);
      alert(err?.message || 'Failed to revoke invitation');
    }
  };

  const handleRotateInvitation = async (invitationId: string) => {
    if (!confirm(bn ? 'পূর্ববর্তী লিংকটি বাতিল করে নতুন লিংক তৈরি করা হবে। চালিয়ে যাবেন?' : 'This will revoke the previous link and issue a fresh link. Continue?')) {
      return;
    }
    try {
      setCreating(true);
      const rotated = await repository.rotateAssessmentInvitation(invitationId, clinicianUser, expiresDays);
      setLatestCreated(rotated);
      await loadInvitations();
    } catch (err: any) {
      console.error('Failed to rotate invitation:', err);
      alert(err?.message || 'Failed to rotate invitation');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <Link className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {bn ? 'রিমোট পেশেন্ট সেলফ-অ্যাসেসমেন্ট লিংক' : 'Remote Patient Intake Portal Link'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {bn ? `রোগী: ${patient.name} (আইডি: ${patient.id})` : `Patient: ${patient.name} (${patient.id})`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Generator Card */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  {bn ? 'নতুন নিরাপদ ইনভাইটেশন তৈরি করুন' : 'Generate Secure Intake Token'}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {bn
                    ? 'রোগী নিজস্ব মোবাইল বা কম্পিউটার থেকে এই লিংকে কোনো লগইন ছাড়াই ফর্ম পূরণ করতে পারবেন।'
                    : 'Patient accesses a dedicated, encrypted intake form without needing account credentials.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={expiresDays}
                  onChange={e => setExpiresDays(Number(e.target.value))}
                  className="text-xs font-semibold px-3 py-2 rounded-xl border border-border bg-card text-foreground"
                >
                  <option value={7}>{bn ? '৭ দিন মেয়াদ' : 'Expires in 7 days'}</option>
                  <option value={14}>{bn ? '১৪ দিন মেয়াদ' : 'Expires in 14 days'}</option>
                  <option value={30}>{bn ? '৩০ দিন মেয়াদ' : 'Expires in 30 days'}</option>
                </select>

                <button
                  type="button"
                  onClick={handleCreateInvitation}
                  disabled={creating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-xs disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {bn ? 'লিংক তৈরি করুন' : 'Generate Link'}
                </button>
              </div>
            </div>

            {/* If a link was just created or selected */}
            {latestCreated && (
              <div className="bg-card border border-primary/30 rounded-xl p-3.5 space-y-2 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wide">
                    {bn ? 'সদ্য প্রস্তুতকৃত লিংক:' : 'Active Invitation Link:'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {bn ? `মেয়াদ শেষ: ${new Date(latestCreated.expires_at).toLocaleDateString()}` : `Expires: ${new Date(latestCreated.expires_at).toLocaleDateString()}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getFullUrl(latestCreated.invitation_token)}
                    className="flex-1 px-3 py-2 rounded-lg bg-muted text-foreground text-xs font-mono border border-border select-all"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(latestCreated.invitation_token)}
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition shadow-xs"
                  >
                    {copiedToken === latestCreated.invitation_token ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        {bn ? 'কপি হয়েছে' : 'Copied'}
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        {bn ? 'কপি' : 'Copy'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => shareViaWhatsApp(latestCreated.invitation_token)}
                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-700 transition shadow-xs"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    WhatsApp
                  </button>
                  <a
                    href={getFullUrl(latestCreated.invitation_token)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition"
                    title={bn ? 'প্রিভিউ দেখুন' : 'Preview Portal'}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Invitation History */}
          <div>
            <h4 className="text-xs font-bold text-foreground mb-3 flex items-center justify-between">
              <span>{bn ? 'এই রোগীর পূর্ববর্তী ইনভাইটেশন হিস্ট্রি' : 'Patient Invitation History'}</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                {invitations.length} {bn ? 'টি তৈরি হয়েছে' : 'total created'}
              </span>
            </h4>

            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {bn ? 'লোড হচ্ছে...' : 'Loading history...'}
              </div>
            ) : invitations.length === 0 ? (
              <div className="py-8 text-center bg-muted/20 border border-dashed border-border rounded-2xl text-xs text-muted-foreground">
                {bn ? 'এই রোগীর জন্য কোনো পূর্ববর্তী ইনভাইটেশন লিংক নেই।' : 'No intake invitations generated yet for this patient.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {invitations.map(inv => {
                  const isExpired = new Date(inv.expires_at).getTime() < Date.now();
                  const effectiveStatus = isExpired && inv.status === 'pending' ? 'expired' : inv.status;

                  return (
                    <div
                      key={inv.id}
                      className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">
                            {inv.invitation_token ? maskToken(inv.invitation_token) : (inv.token_hash ? `hash:${inv.token_hash.slice(0, 10)}...` : '********')}
                          </span>
                          {effectiveStatus === 'completed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {bn ? 'সম্পন্ন' : 'Submitted'}
                            </span>
                          )}
                          {effectiveStatus === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {bn ? 'অপেক্ষমাণ' : 'Pending'}
                            </span>
                          )}
                          {effectiveStatus === 'expired' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {bn ? 'মেয়াদ শেষ' : 'Expired'}
                            </span>
                          )}
                          {effectiveStatus === 'revoked' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1">
                              <Ban className="h-3 w-3" />
                              {bn ? 'বাতিলকৃত' : 'Revoked'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                          <span>
                            {bn ? 'তৈরি:' : 'Created:'} {new Date(inv.created_at).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>
                            {bn ? 'মেয়াদ:' : 'Expires:'} {new Date(inv.expires_at).toLocaleDateString()}
                          </span>
                          {inv.access_count !== undefined && (
                            <>
                              <span>•</span>
                              <span>
                                {bn ? `খোলা হয়েছে: ${inv.access_count} বার` : `Opened: ${inv.access_count}x`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {effectiveStatus === 'pending' ? (
                          <>
                            {inv.invitation_token ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(inv.invitation_token)}
                                  className="px-2.5 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-foreground text-[11px] font-semibold flex items-center gap-1 transition"
                                >
                                  {copiedToken === inv.invitation_token ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-600" />
                                      {bn ? 'কপি হয়েছে' : 'Copied'}
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      {bn ? 'লিংক কপি' : 'Copy'}
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => shareViaWhatsApp(inv.invitation_token)}
                                  className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition"
                                  title="Share via WhatsApp"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </button>
                                <a
                                  href={getFullUrl(inv.invitation_token)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition"
                                  title="Open Link"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </>
                            ) : (
                              <span 
                                className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-md"
                                title={bn ? 'টোকেন হ্যাশ ডাটাবেসে সুরক্ষিত। নতুন লিংকের জন্য Rotate চাপুন।' : 'Token hash secured in database. Use Rotate to issue a fresh link.'}
                              >
                                {bn ? 'টোকেন সুরক্ষিত' : 'Token hashed'}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRotateInvitation(inv.id)}
                              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-primary transition"
                              title={bn ? 'লিংক পরিবর্তন (Rotate)' : 'Rotate Link (Revoke & Re-issue)'}
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevokeInvitation(inv.id)}
                              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 transition"
                              title={bn ? 'লিংক বাতিল (Revoke)' : 'Revoke Link'}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic px-2">
                            {effectiveStatus === 'completed'
                              ? (bn ? 'ফর্ম গৃহীত হয়েছে' : 'Submission Completed')
                              : (bn ? 'অকার্যকর' : 'Inactive')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition"
          >
            {bn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
