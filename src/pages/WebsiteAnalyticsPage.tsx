import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { userWebsiteService } from '@/lib/website-builder-service';
import { getFormSubmissions } from '@/lib/form-submission-handler';
import { UserWebsite } from '@/lib/website-builder-types';
import { ArrowLeft, Users, Mail, Phone, Calendar, ExternalLink } from 'lucide-react';

export default function WebsiteAnalyticsPage() {
  const { websiteId } = useParams();
  const { user } = useAuth();
  const [website, setWebsite] = useState<UserWebsite | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (websiteId && user) {
      loadWebsiteData();
    }
  }, [websiteId, user]);

  const loadWebsiteData = async () => {
    try {
      // Load website details
      const websiteData = await userWebsiteService.getById(websiteId!);
      setWebsite(websiteData);

      // Load form submissions
      const submissionsData = await getFormSubmissions(websiteId!);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading website data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">Website not found</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/templates"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Templates
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{website.name}</h1>
              <p className="text-muted-foreground">Website Analytics & Form Submissions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`https://${website.subdomain}.bizsuiteai.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent"
            >
              <ExternalLink className="w-4 h-4" />
              View Live Site
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Total Submissions</span>
            </div>
            <p className="text-2xl font-bold">{submissions.length}</p>
          </div>
          
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Email Captures</span>
            </div>
            <p className="text-2xl font-bold">
              {submissions.filter(s => s.email).length}
            </p>
          </div>
          
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Phone Numbers</span>
            </div>
            <p className="text-2xl font-bold">
              {submissions.filter(s => s.phone).length}
            </p>
          </div>
          
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">This Month</span>
            </div>
            <p className="text-2xl font-bold">
              {submissions.filter(s => {
                const submissionDate = new Date(s.submitted_at);
                const now = new Date();
                return submissionDate.getMonth() === now.getMonth() && 
                       submissionDate.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>

        {/* Form Submissions Table */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Form Submissions</h2>
            <p className="text-sm text-muted-foreground">
              All form submissions from your website
            </p>
          </div>
          
          {submissions.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
              <p className="text-muted-foreground">
                Form submissions will appear here once visitors start filling out your forms.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Phone</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Form Data</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission, index) => (
                    <tr key={submission.id || index} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {submission.email || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {submission.phone || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-800">
                            View Details
                          </summary>
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <pre>{JSON.stringify(submission.form_data, null, 2)}</pre>
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}