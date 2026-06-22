'use client';

import { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { ActivityRow } from '@/types/activity';
import styles from './FileUploader.module.css';

interface RecentFile {
  id: string;
  name: string;
  timestamp: number;
  data: ActivityRow[];
}

interface Props {
  onDataLoaded: (data: ActivityRow[], fileName?: string) => void;
  recentFiles: RecentFile[];
  onLoadRecent: (file: RecentFile) => void;
}

// Flexible column mapping — tries multiple common header names
function mapRow(raw: Record<string, unknown>): ActivityRow {
  const get = (...keys: string[]): string => {
    for (const k of keys) {
      const val = raw[k] ?? raw[k.toLowerCase()] ?? raw[k.toUpperCase()];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim();
      }
    }
    // Fuzzy match
    const rawKeys = Object.keys(raw);
    for (const k of keys) {
      const found = rawKeys.find((rk) =>
        rk.toLowerCase().replace(/[\s_\-]/g, '').includes(k.toLowerCase().replace(/[\s_\-]/g, ''))
      );
      if (found && raw[found] !== undefined && raw[found] !== null) {
        return String(raw[found]).trim();
      }
    }
    return '';
  };

  return {
    accountName: get('Account Name', 'AccountName', 'Account', 'account_name', 'ACCOUNT NAME'),
    reason: get('Reason', 'reason', 'REASON', 'Description', 'description'),
    timePosted: get(
      'Time Posted',
      'TimePosted',
      'time_posted',
      'Date',
      'date',
      'Posted Date',
      'Timestamp',
      'TIME POSTED',
      'DATE'
    ),
    crRitm: get('CR/RITM', 'CR', 'RITM', 'cr_ritm', 'Change Request', 'CRRitm', 'cr/ritm'),
    concernTeam: get(
      'Concern Team',
      'ConcernTeam',
      'concern_team',
      'Team',
      'team',
      'CONCERN TEAM',
      'Concerned Team'
    ),
    quarter: get('Quarter', 'quarter', 'QUARTER', 'Q', 'Qtr'),
    environment: get('Environment', 'environment', 'ENVIRONMENT', 'Env', 'env', 'ENV'),
    ...Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)])
    ),
  };
}

export default function FileUploader({ onDataLoaded, recentFiles, onLoadRecent }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      if (!file) return;
      setError('');
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
            defval: '',
            raw: false,
          });
          const mapped = json.map(mapRow).filter((r) => r.accountName !== '');
          if (mapped.length === 0) {
            setError(
              "Couldn't find an 'Account Name' column. Please check your Excel headers."
            );
          } else {
            onDataLoaded(mapped, file.name);
          }
        } catch {
          setError('Failed to parse the file. Make sure it is a valid .xlsx or .xls file.');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [onDataLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src="/ptc-logo.svg" alt="PTC Logo" className={styles.logo} />
          <h1 className={styles.title}>Customer Issue Tracker</h1>
          <p className={styles.subtitle}>
            Drop Your Excel/CSV File
          </p>
        </div>

        <div
          id="upload-zone"
          className={`${styles.dropzone} ${dragging ? styles.isDragging : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && document.getElementById('file-input')?.click()}
          aria-label="Upload Excel file"
        >
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            className={styles.hiddenInput}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
          />
          <div className={styles.dropzoneContent}>
            {loading ? (
              <div className={styles.iconWrapper}>
                <div className={styles.spinner} />
              </div>
            ) : (
              <div className={styles.iconWrapper}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
            )}
            <p className={styles.dropzoneText}>
              {loading ? 'Parsing your file…' : 'Drag & drop your Excel/CSV file here'}
            </p>
            <p className={styles.dropzoneSubtext}>
              {loading ? '' : 'or click to browse — supports .xlsx, .xls, .csv'}
            </p>
          </div>
        </div>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {recentFiles.length > 0 && (
          <div className={styles.recentFiles}>
            <div className={styles.recentTitle}>Recent Files</div>
            <div className={styles.recentList}>
              {recentFiles.map((file) => (
                <button
                  key={file.id}
                  className={styles.recentItem}
                  onClick={() => onLoadRecent(file)}
                >
                  <div className={styles.recentInfo}>
                    <p className={styles.recentName}>{file.name}</p>
                    <p className={styles.recentTime}>
                      {new Date(file.timestamp).toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
