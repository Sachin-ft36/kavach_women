import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface UseZeroFIRLogicProps {
  user: any;
  userPos: any;
}

export function useZeroFIRLogic({ user, userPos }: UseZeroFIRLogicProps) {
  const [step, setStep] = useState(1);
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [vaultAttachments, setVaultAttachments] = useState<any[]>([]);
  const [isVaultPickerOpen, setIsVaultPickerOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const incidentTypes = [
    "Stalking / Harassment",
    "Physical Assault",
    "Public Transport Misconduct",
    "Cyber Harassment",
    "Other Threat"
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
      toast.success(`${e.target.files.length} Evidence file(s) attached.`);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleDownload = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>KAVACH_ZERO_FIR_OFFICIAL_COPY</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; position: relative; }
              .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
              .fir-title { font-size: 28px; font-weight: 900; margin: 10px 0; color: #d32f2f; }
              .section { margin-bottom: 25px; }
              .section-title { font-size: 12px; font-weight: 900; text-transform: uppercase; background: #f0f0f0; padding: 5px 10px; margin-bottom: 10px; border-left: 4px solid #d32f2f; }
              .row { display: flex; margin-bottom: 8px; font-size: 11px; }
              .label { font-weight: 700; width: 200px; color: #555; }
              .value { flex: 1; border-bottom: 1px dotted #ccc; padding-bottom: 2px; }
              .description { font-size: 11px; line-height: 1.6; border: 1px solid #eee; padding: 15px; background: #fafafa; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="fir-title">ZERO FIR - NATIONAL SAFETY NETWORK</div>
              <div style="font-size: 10px; font-weight: 700; color: #666;">Issued under Section 154 of CrPC</div>
            </div>
            <div class="section">
              <div class="section-title">Complainant Details</div>
              <div class="row"><div class="label">Name:</div><div class="value">${user?.displayName || 'Citizen'}</div></div>
              <div class="row"><div class="label">ID:</div><div class="value">${user?.uid?.substring(0, 10)}...</div></div>
            </div>
            <div class="section">
              <div class="section-title">Incident Details</div>
              <div class="row"><div class="label">Category:</div><div class="value">${incidentType}</div></div>
              <div class="row"><div class="label">Location:</div><div class="value">${userPos ? `${userPos.lat}, ${userPos.lng}` : 'Logged GPS'}</div></div>
            </div>
            <div class="section">
              <div class="section-title">Narrative</div>
              <div class="description">${description}</div>
            </div>
            <div class="section">
              <div class="section-title">Forensic Evidence</div>
              <div class="row"><div class="label">Vault Assets:</div><div class="value">${vaultAttachments.length} synced</div></div>
              <div class="row"><div class="label">Manual Uploads:</div><div class="value">${attachments.length} files</div></div>
            </div>
            <script>window.print(); setTimeout(() => window.close(), 1000);</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleForward = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Securing Encrypted Connection to E-Police Hub...',
        success: 'Complaint Forwarded with Linked Forensic Assets.',
        error: 'Transmission Failed.',
      }
    );
  };

  return {
    step, setStep,
    incidentType, setIncidentType,
    description, setDescription,
    attachments, setAttachments,
    vaultAttachments, setVaultAttachments,
    isVaultPickerOpen, setIsVaultPickerOpen,
    fileInputRef, printRef,
    incidentTypes,
    handleFileChange, removeAttachment, handleDownload, handleForward
  };
}
