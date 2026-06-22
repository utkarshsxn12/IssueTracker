'use client';

import { useMemo, useState } from 'react';
import { ActivityRow } from '@/types/activity';
import styles from './Dashboard.module.css';

interface Props {
  data: ActivityRow[];
  onReset: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Dashboard({ data, onReset }: Props) {
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedReasonAccount, setSelectedReasonAccount] = useState<string>('');
  const [reasonSearch, setReasonSearch] = useState('');
  const [reasonDropdownOpen, setReasonDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [sortKey, setSortKey] = useState<keyof ActivityRow>('timePosted');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [teamPopupOpen, setTeamPopupOpen] = useState(false);
  const [accountsPopupOpen, setAccountsPopupOpen] = useState(false);
  const [monthsPopupOpen, setMonthsPopupOpen] = useState(false);

  const allAccounts = useMemo(() => {
    const set = new Set(data.map((r) => r.accountName).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const accountsWithReason = useMemo(() => {
    const set = new Set(
      data.filter((r) => r.accountName && r.reason && r.reason.trim() !== '').map((r) => r.accountName)
    );
    return Array.from(set).sort();
  }, [data]);

  const months = useMemo(() => {
    const monthMap = new Map<number, number>();
    data.forEach((r) => {
      if (r.timePosted) {
        const d = new Date(r.timePosted);
        if (!isNaN(d.getTime())) {
          const m = d.getMonth();
          monthMap.set(m, (monthMap.get(m) || 0) + 1);
        }
      }
    });
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([m]) => MONTH_NAMES[m]);
  }, [data]);

  const filteredAll = useMemo(
    () => allAccounts.filter((a) => a.toLowerCase().includes(search.toLowerCase())),
    [allAccounts, search]
  );

  const filteredWithReason = useMemo(
    () => accountsWithReason.filter((a) => a.toLowerCase().includes(reasonSearch.toLowerCase())),
    [accountsWithReason, reasonSearch]
  );

  const activeAccount = selectedAccount || selectedReasonAccount;

  const rowMatchesMonth = (row: ActivityRow): boolean => {
    if (!selectedMonth) return true;
    if (!row.timePosted) return false;
    const d = new Date(row.timePosted);
    if (isNaN(d.getTime())) return false;
    return MONTH_NAMES[d.getMonth()] === selectedMonth;
  };

  const filteredData = useMemo(() => {
    return data.filter((r) => rowMatchesMonth(r));
  }, [data, selectedMonth]);

  const accountRows = useMemo(() => {
    if (activeAccount) {
      return filteredData.filter((r) => r.accountName === activeAccount);
    } else if (selectedMonth) {
      return filteredData;
    }
    return [];
  }, [filteredData, activeAccount, selectedMonth]);

  const sortedRows = useMemo(() => {
    return [...accountRows].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [accountRows, sortKey, sortDir]);

  const teamList = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach((r) => {
      const t = r.concernTeam?.trim();
      if (t && !t.toLowerCase().includes('not due to maintenance')) {
        map.set(t.toLowerCase(), t);
      }
    });
    return Array.from(map.values()).sort();
  }, [data]);

  const handleSort = (key: keyof ActivityRow) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }: { k: keyof ActivityRow }) => (
    sortKey === k
      ? <span className={styles.sortActive}>{sortDir === 'asc' ? '↑' : '↓'}</span>
      : <span className={styles.sortInactive}>↕</span>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <img src="/ptc2.png" alt="PTC Logo" className={styles.logo} />
          <div>
            <h1 className={styles.headerTitle}>Customer Issue Tracker</h1>
            <p className={styles.headerSub}>Account Activity Monitor</p>
          </div>
        </div>
        <button id="upload-new-btn" className={styles.resetBtn} onClick={onReset}>
          Upload New File
        </button>
      </header>

      <div className={styles.statsRow}>
        {[
          { label: 'Total Records', value: data.length, clickable: false, popup: null },
          { label: 'Unique Accounts', value: allAccounts.length, clickable: true, popup: 'accounts' },
          { label: 'Concern Teams', value: teamList.length, clickable: true, popup: 'teams' },
          { label: 'Months Covered', value: months.length, clickable: true, popup: 'months' },
        ].map((s) => (
          <div
            key={s.label}
            className={`${styles.statCard} ${s.clickable ? styles.statCardClickable : ''}`}
            onClick={() => {
              if (s.clickable) {
                if (s.popup === 'teams') setTeamPopupOpen(true);
                if (s.popup === 'accounts') setAccountsPopupOpen(true);
                if (s.popup === 'months') setMonthsPopupOpen(true);
              }
            }}
            role={s.clickable ? 'button' : undefined}
            tabIndex={s.clickable ? 0 : undefined}
            onKeyDown={(e) => {
              if (s.clickable && e.key === 'Enter') {
                if (s.popup === 'teams') setTeamPopupOpen(true);
                if (s.popup === 'accounts') setAccountsPopupOpen(true);
                if (s.popup === 'months') setMonthsPopupOpen(true);
              }
            }}
          >
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
            {s.clickable && <div className={styles.statCardHint}>click to view</div>}
          </div>
        ))}
      </div>

      {teamPopupOpen && (
        <div className={styles.popupOverlay} onClick={() => setTeamPopupOpen(false)}>
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <span>Concern Teams</span>
              <button className={styles.popupClose} onClick={() => setTeamPopupOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className={styles.popupBody}>
              {teamList.map((team, i) => (
                <div key={team} className={styles.popupTeamRow}>
                  <span className={styles.popupTeamIndex}>{i + 1}</span>
                  <span className={styles.popupTeamName}>{team}</span>
                  <span className={styles.popupTeamCount}>
                    {data.filter((r) => r.concernTeam?.trim().toLowerCase() === team.toLowerCase()).length} records
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {accountsPopupOpen && (
        <div className={styles.popupOverlay} onClick={() => setAccountsPopupOpen(false)}>
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <span>Unique Accounts</span>
              <button className={styles.popupClose} onClick={() => setAccountsPopupOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className={styles.popupBody}>
              {allAccounts.map((account, i) => (
                <div key={account} className={styles.popupTeamRow}>
                  <span className={styles.popupTeamIndex}>{i + 1}</span>
                  <span className={styles.popupTeamName}>{account}</span>
                  <span className={styles.popupTeamCount}>
                    {data.filter((r) => r.accountName === account).length} records
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {monthsPopupOpen && (
        <div className={styles.popupOverlay} onClick={() => setMonthsPopupOpen(false)}>
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <span>Months Covered</span>
              <button className={styles.popupClose} onClick={() => setMonthsPopupOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className={styles.popupBody}>
              {months.map((month, i) => {
                let count = 0;
                const monthIndex = MONTH_NAMES.indexOf(month);
                data.forEach((r) => {
                  if (r.timePosted) {
                    const d = new Date(r.timePosted);
                    if (!isNaN(d.getTime()) && d.getMonth() === monthIndex) {
                      count++;
                    }
                  }
                });
                return (
                  <div
                    key={month}
                    className={`${styles.popupTeamRow} ${styles.statCardClickable}`}
                    onClick={() => {
                      setSelectedMonth(month);
                      setMonthsPopupOpen(false);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setSelectedMonth(month);
                        setMonthsPopupOpen(false);
                      }
                    }}
                  >
                    <span className={styles.popupTeamIndex}>{i + 1}</span>
                    <span className={styles.popupTeamName}>{month}</span>
                    <span className={styles.popupTeamCount}>{count} records</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <section className={styles.selectorSection}>
        <div className={styles.dropdownRow}>
          <div className={styles.dropdownBlock}>
            <div className={styles.dropdownLabel}>All Accounts</div>
            <div className={styles.dropdownWrapper}>
              <div
                id="account-dropdown-trigger"
                className={`${styles.dropdownTrigger} ${dropdownOpen ? styles.dropdownTriggerOpen : ''} ${selectedAccount ? styles.dropdownTriggerSelected : ''}`}
                onClick={() => { setDropdownOpen((o) => !o); setReasonDropdownOpen(false); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setDropdownOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
              >
                <span className={`${styles.dropdownValue} ${!selectedAccount ? styles.placeholder : ''}`}>
                  {selectedAccount || 'Choose an account…'}
                </span>
                {selectedAccount && (
                  <button className={styles.clearBtn} onClick={(e) => { e.stopPropagation(); setSelectedAccount(''); }} aria-label="Clear">✕</button>
                )}
                <svg className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {dropdownOpen && (
                <div className={styles.dropdownMenu} role="listbox">
                  <div className={styles.searchWrapper}>
                    <input
                      id="account-search-input"
                      className={styles.searchInput}
                      type="text"
                      placeholder="Search accounts…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className={styles.optionList}>
                    {filteredAll.length === 0 ? (
                      <div className={styles.noResults}>No accounts found</div>
                    ) : filteredAll.map((acc) => (
                      <div key={acc} role="option" aria-selected={acc === selectedAccount}
                        className={`${styles.option} ${acc === selectedAccount ? styles.optionActive : ''}`}
                        onClick={() => { setSelectedAccount(acc); setSelectedReasonAccount(''); setDropdownOpen(false); setSearch(''); }}
                      >
                        <span>{acc}</span>
                        <span className={styles.optionCount}>{data.filter((r) => r.accountName === acc).length} records</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.orDivider}><span>or</span></div>

          <div className={styles.dropdownBlock}>
            <div className={styles.dropdownLabel}>
              Accounts with Reasons
              <span className={styles.reasonBadge}>{accountsWithReason.length}</span>
            </div>
            <div className={styles.dropdownWrapper}>
              <div
                id="reason-account-dropdown-trigger"
                className={`${styles.dropdownTrigger} ${styles.dropdownTriggerReason} ${reasonDropdownOpen ? styles.dropdownTriggerOpen : ''} ${selectedReasonAccount ? styles.dropdownTriggerSelectedReason : ''}`}
                onClick={() => { setReasonDropdownOpen((o) => !o); setDropdownOpen(false); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setReasonDropdownOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={reasonDropdownOpen}
              >
                <span className={`${styles.dropdownValue} ${!selectedReasonAccount ? styles.placeholder : ''}`}>
                  {selectedReasonAccount || 'Accounts that have reasons…'}
                </span>
                {selectedReasonAccount && (
                  <button className={styles.clearBtnReason} onClick={(e) => { e.stopPropagation(); setSelectedReasonAccount(''); }} aria-label="Clear">✕</button>
                )}
                <svg className={`${styles.chevron} ${reasonDropdownOpen ? styles.chevronOpen : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {reasonDropdownOpen && (
                <div className={`${styles.dropdownMenu} ${styles.dropdownMenuReason}`} role="listbox">
                  <div className={styles.dropdownMenuHint}>
                    Only accounts with at least one reason filled in
                  </div>
                  <div className={styles.searchWrapper}>
                    <input
                      id="reason-account-search-input"
                      className={styles.searchInput}
                      type="text"
                      placeholder="Search…"
                      value={reasonSearch}
                      onChange={(e) => setReasonSearch(e.target.value)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className={styles.optionList}>
                    {filteredWithReason.length === 0 ? (
                      <div className={styles.noResults}>No accounts found</div>
                    ) : filteredWithReason.map((acc) => (
                      <div key={acc} role="option" aria-selected={acc === selectedReasonAccount}
                        className={`${styles.option} ${acc === selectedReasonAccount ? styles.optionActiveReason : ''}`}
                        onClick={() => { setSelectedReasonAccount(acc); setSelectedAccount(''); setReasonDropdownOpen(false); setReasonSearch(''); }}
                      >
                        <span>{acc}</span>
                        <span className={styles.optionCountReason}>
                          {data.filter((r) => r.accountName === acc && r.reason).length} w/ reason
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {activeAccount || selectedMonth ? (
        <section className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div className={styles.tableHeaderLeft}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                {activeAccount ? 'Activities for' : 'Activities in'}
              </h2>
              {activeAccount && (
                <span className={`${styles.accountBadge} ${selectedReasonAccount ? styles.accountBadgeReason : ''}`}>
                  {activeAccount}
                </span>
              )}
              {selectedMonth && (
                <span className={styles.accountBadge}>
                  {selectedMonth}
                </span>
              )}
              {selectedReasonAccount && <span className={styles.filterTag}>Has Reasons</span>}
              <span className={styles.recordCount}>{sortedRows.length} records</span>
              {selectedMonth && (
                <button 
                  className={styles.clearBtn}
                  onClick={() => setSelectedMonth('')}
                  aria-label="Clear"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {([
                    { key: 'accountName', label: 'Account Name' },
                    { key: 'reason', label: 'Reason' },
                    { key: 'timePosted', label: 'Time Posted' },
                    { key: 'crRitm', label: 'CR / RITM' },
                    { key: 'concernTeam', label: 'Concern Team' },
                    { key: 'quarter', label: 'Quarter' },
                    { key: 'environment', label: 'Environment' },
                  ] as { key: keyof ActivityRow; label: string }[]).map((col) => (
                    <th key={col.key} className={styles.th} onClick={() => handleSort(col.key)}
                      role="columnheader"
                      aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <span>{col.label}</span>
                      <SortIcon k={col.key} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, i) => (
                  <tr key={i} className={styles.tr}>
                    <td className={styles.td}><span className={styles.accountCell}>{row.accountName || '—'}</span></td>
                    <td className={`${styles.td} ${styles.reasonCell}`}>{row.reason || '—'}</td>
                    <td className={styles.td}>
                      {row.timePosted ? <span className={styles.timePill}>{row.timePosted}</span> : '—'}
                    </td>
                    <td className={styles.td}>
                      {row.crRitm ? <span className={styles.crPill}>{row.crRitm}</span> : <span className={styles.naCr}>—</span>}
                    </td>
                    <td className={styles.td}>
                      {row.concernTeam ? <span className={styles.teamPill}>{row.concernTeam}</span> : '—'}
                    </td>
                    <td className={styles.td}>
                      {row.quarter ? <span className={styles.quarterPill}>{row.quarter}</span> : '—'}
                    </td>
                    <td className={styles.td}>
                      {row.environment ? <span className={styles.envPill}>{row.environment}</span> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!activeAccount && !selectedMonth ? (
        <div className={styles.emptyState}>
          <p>Select an account from above or click on a month in the Months Covered KPI to view activities</p>
        </div>
      ) : null}
    </div>
  );
}
