'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getPracticeRepository } from '@/repositories';
import { AssessmentInvitation, AssessmentSubmission } from '@/repositories/types';
import { IntakeInvalidToken } from '@/components/intake/IntakeInvalidToken';
import { IntakeSubmittedSuccess } from '@/components/intake/IntakeSubmittedSuccess';
import { PatientIntakeForm } from '@/components/intake/PatientIntakeForm';
import { Loader2 } from 'lucide-react';

function IntakePageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [invitationStatus, setInvitationStatus] = useState<
    'missing' | 'expired' | 'revoked' | 'completed' | 'error' | 'ready' | 'submitted'
  >('missing');

  const [invitation, setInvitation] = useState<AssessmentInvitation | null>(null);
  const [patientName, setPatientName] = useState<string>('Patient');
  const [initialAge, setInitialAge] = useState<number>(35);
  const [initialGender, setInitialGender] = useState<'male' | 'female'>('female');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedRecord, setSubmittedRecord] = useState<AssessmentSubmission | null>(null);

  const verifyToken = async () => {
    if (!token) {
      setInvitationStatus('missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const repo = getPracticeRepository();
      const inv = await repo.getAssessmentInvitationByToken(token);

      if (!inv) {
        setInvitationStatus('missing');
        setLoading(false);
        return;
      }

      setInvitation(inv);

      // Check revocation
      if (inv.status === 'revoked') {
        setInvitationStatus('revoked');
        setLoading(false);
        return;
      }

      // Check expiration
      const expiresAt = new Date(inv.expires_at).getTime();
      if (expiresAt < Date.now()) {
        setInvitationStatus('expired');
        setLoading(false);
        return;
      }

      // Check already completed
      if (inv.status === 'completed') {
        setInvitationStatus('completed');
        setLoading(false);
        return;
      }

      // Attempt to retrieve active patient name & basic demographics
      try {
        const patient = await repo.getPatientById(inv.patient_id);
        if (patient) {
          setPatientName(patient.name);
          setInitialAge(patient.age);
          setInitialGender(patient.gender);
        }
      } catch (err) {
        // Demographics optional in public portal
      }

      setInvitationStatus('ready');
    } catch (err: any) {
      console.error('Error verifying intake token:', err);
      setErrorMsg(err?.message || 'Failed to verify intake token');
      setInvitationStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyToken();
  }, [token]);

  const handleSubmit = async (responses: Record<string, any>) => {
    if (!token) return;

    try {
      setIsSubmitting(true);
      const repo = getPracticeRepository();
      const submission = await repo.submitAssessment(token, responses);
      setSubmittedRecord(submission);
      setInvitationStatus('submitted');
    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      alert(err?.message || 'Failed to submit intake assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Securing Clinical Intake Portal...
          </p>
        </div>
      </div>
    );
  }

  if (invitationStatus === 'submitted' && submittedRecord) {
    return <IntakeSubmittedSuccess submission={submittedRecord} patientName={patientName} />;
  }

  if (invitationStatus === 'ready' && invitation) {
    return (
      <PatientIntakeForm
        invitation={invitation}
        patientName={patientName}
        initialAge={initialAge}
        initialGender={initialGender}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <IntakeInvalidToken
      reason={invitationStatus === 'ready' || invitationStatus === 'submitted' ? 'error' : invitationStatus}
      errorMessage={errorMsg || undefined}
      onRetry={verifyToken}
    />
  );
}

export default function IntakePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
              Loading Intake Portal...
            </p>
          </div>
        </div>
      }
    >
      <IntakePageContent />
    </Suspense>
  );
}
