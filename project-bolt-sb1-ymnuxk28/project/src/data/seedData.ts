import type { Ticket } from '@/types';
import { uid, nowISO } from '@/utils';

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export function createSeedTickets(): Ticket[] {
  const base = [
    {
      ticketNumber: 'TS1-4821',
      title: 'Nightly backup failure — SQL Server',
      description:
        'The nightly full backup job on the primary SQL Server cluster failed at 2:14 AM. Error log indicates VSS writer timeout. Need to investigate if the shadow copy storage limit was exceeded.',
      primaryContact: 'Sarah Mitchell',
      company: 'Northwind Logistics',
      source: 'Ticket System 1',
      officialPriority: 'Critical' as const,
      workQueue: 'Focus on Now' as const,
      tags: ['backup', 'sql-server', 'infrastructure'],
      followUpDate: null as string | null,
      createdAt: daysAgo(1),
      updatedAt: hoursAgo(2),
      completedAt: null as string | null,
      resolution: null as string | null,
      archived: false,
      updates: [
        { id: uid(), text: 'Received alert from monitoring. Backup job failed at 2:14 AM.', createdAt: hoursAgo(5) },
        { id: uid(), text: 'Checked VSS writer status — all writers are in stable state. Reviewing shadow copy storage allocation.', createdAt: hoursAgo(3) },
        { id: uid(), text: 'Shadow copy storage limit was at 100%. Increased allocation from 5GB to 15GB. Re-running backup job.', createdAt: hoursAgo(2) },
      ],
    },
    {
      ticketNumber: 'TS1-4830',
      title: 'Database connection pool exhaustion',
      description:
        'Application servers are intermittently unable to connect to the database. Connection pool appears to be exhausted. Customer reports intermittent 503 errors on their production portal.',
      primaryContact: 'James Park',
      company: 'Contoso Manufacturing',
      source: 'Ticket System 1',
      officialPriority: 'High' as const,
      workQueue: 'Focus on Now' as const,
      tags: ['database', 'connection-pool', 'production'],
      followUpDate: daysFromNow(1),
      createdAt: daysAgo(2),
      updatedAt: hoursAgo(4),
      completedAt: null,
      resolution: null,
      archived: false,
      updates: [
        { id: uid(), text: 'Reviewed connection pool metrics. Peak connections hitting 95% of max (100/105).', createdAt: hoursAgo(8) },
        { id: uid(), text: 'Identified a long-running query holding connections. Working with DBA team to optimize.', createdAt: hoursAgo(4) },
      ],
    },
    {
      ticketNumber: 'TS2-1124',
      title: 'Tape library communication error',
      description:
        'The tape library is reporting SCSI communication errors on drive 3. Backup exec is unable to write to this drive. Other drives are functioning normally.',
      primaryContact: 'Robert Chen',
      company: 'Fabrikam Inc.',
      source: 'Ticket System 2',
      officialPriority: 'High' as const,
      workQueue: 'Next Up' as const,
      tags: ['tape-library', 'hardware', 'backup'],
      followUpDate: daysFromNow(2),
      createdAt: daysAgo(3),
      updatedAt: hoursAgo(20),
      completedAt: null,
      resolution: null,
      archived: false,
      updates: [
        { id: uid(), text: 'Checked tape drive 3 status via library admin console. Drive shows as "error".', createdAt: hoursAgo(24) },
        { id: uid(), text: 'Cleaned drive head with cleaning cartridge. Re-running diagnostic.', createdAt: hoursAgo(20) },
      ],
    },
    {
      ticketNumber: 'TS2-1198',
      title: 'Application crash on report export',
      description:
        'Customer reports the reporting module crashes when exporting large datasets (>50K rows) to Excel. Smaller exports work fine. Likely memory issue on the application server.',
      primaryContact: 'Emily Watson',
      company: 'Adventure Works',
      source: 'Ticket System 2',
      officialPriority: 'Medium' as const,
      workQueue: 'When You Have Time' as const,
      tags: ['application', 'crash', 'export'],
      followUpDate: daysFromNow(5),
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
      completedAt: null,
      resolution: null,
      archived: false,
      updates: [
        { id: uid(), text: 'Reproduced the crash with a 60K row export. Application pool memory spikes to 4GB before crash.', createdAt: daysAgo(3) },
        { id: uid(), text: 'Recommended implementing streaming export. Waiting on development to evaluate.', createdAt: daysAgo(1) },
      ],
    },
    {
      ticketNumber: 'TS1-4799',
      title: 'Customer configuration — email notifications not sending',
      description:
        'Customer configured SMTP settings but email notifications are not being sent. Need to verify SMTP credentials and firewall rules.',
      primaryContact: 'David Kumar',
      company: 'Wide World Importers',
      source: 'Ticket System 1',
      officialPriority: 'Medium' as const,
      workQueue: 'Pending Customer' as const,
      tags: ['configuration', 'email', 'smtp'],
      followUpDate: daysFromNow(1),
      createdAt: daysAgo(4),
      updatedAt: daysAgo(2),
      completedAt: null,
      resolution: null,
      archived: false,
      updates: [
        { id: uid(), text: 'Reviewed SMTP configuration. Settings look correct. Asked customer to verify their mail server allows connections from our IP range.', createdAt: daysAgo(2) },
      ],
    },
    {
      ticketNumber: 'TS2-1205',
      title: 'Development escalation — memory leak in worker service',
      description:
        'The background worker service appears to have a memory leak. Memory usage grows steadily over 48 hours until the service crashes. Thread dumps show unclosed connections.',
      primaryContact: 'Lisa Anderson',
      company: 'Tailspin Toys',
      source: 'Ticket System 2',
      officialPriority: 'Critical' as const,
      workQueue: 'Pending Development' as const,
      tags: ['memory-leak', 'development', 'escalation'],
      followUpDate: daysFromNow(3),
      createdAt: daysAgo(6),
      updatedAt: daysAgo(3),
      completedAt: null,
      resolution: null,
      archived: false,
      updates: [
        { id: uid(), text: 'Captured heap dumps at 12h, 24h, and 36h intervals. Confirmed steady memory growth.', createdAt: daysAgo(5) },
        { id: uid(), text: 'Escalated to development with heap dump analysis. Dev team confirmed connection pool not releasing connections properly. Fix in progress.', createdAt: daysAgo(3) },
      ],
    },
    {
      ticketNumber: 'TS1-4750',
      title: 'Low priority — cosmetic UI issue on dashboard',
      description:
        'Minor alignment issue on the analytics dashboard. Chart legend overlaps with the date picker on smaller screens. Not affecting functionality.',
      primaryContact: 'Mark Thompson',
      company: 'Northwind Logistics',
      source: 'Ticket System 1',
      officialPriority: 'Low' as const,
      workQueue: 'Back Burner' as const,
      tags: ['ui', 'cosmetic'],
      followUpDate: null,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(7),
      completedAt: null,
      resolution: null,
      archived: false,
      updates: [
        { id: uid(), text: 'Confirmed the alignment issue. Will address in next maintenance window.', createdAt: daysAgo(7) },
      ],
    },
    {
      ticketNumber: 'TS1-4701',
      title: 'Resolved — Backup schedule reconfiguration',
      description:
        'Customer requested changing the backup schedule from daily full to weekly full + daily incremental. Configuration completed and verified.',
      primaryContact: 'Sarah Mitchell',
      company: 'Northwind Logistics',
      source: 'Ticket System 1',
      officialPriority: 'Medium' as const,
      workQueue: 'When You Have Time' as const,
      tags: ['backup', 'configuration'],
      followUpDate: null,
      createdAt: daysAgo(15),
      updatedAt: daysAgo(8),
      completedAt: daysAgo(8),
      resolution: 'Reconfigured backup schedule to weekly full + daily incremental. Verified first incremental backup completed successfully. Customer confirmed satisfaction.',
      archived: true,
      updates: [
        { id: uid(), text: 'Reviewed current backup configuration with customer.', createdAt: daysAgo(14) },
        { id: uid(), text: 'Reconfigured schedule. Running test backup to verify.', createdAt: daysAgo(9) },
        { id: uid(), text: 'Test backup successful. Customer confirmed new schedule works as expected.', createdAt: daysAgo(8) },
      ],
    },
  ];

  return base.map((t, i) => ({
    ...t,
    id: uid(),
    boardPosition: i,
    archiveReason: t.archived ? ('completed' as const) : null,
    qmon: null,
    legacyCaseNumber: null,
  }));
}
