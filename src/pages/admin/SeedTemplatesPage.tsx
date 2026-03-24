import { useState } from 'react';
import { seedTemplates } from '@/lib/seed-templates';

export default function SeedTemplatesPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeed = async () => {
    setLoading(true);
    setMessage('Seeding templates...');
    try {
      await seedTemplates();
      setMessage('✓ Templates seeded successfully!');
    } catch (error) {
      setMessage(`✗ Error: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div className="w-full h-full overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Seed Templates</h1>
        <p className="text-muted-foreground mb-6">
          This will populate the database with beautiful landing page templates across multiple categories.
        </p>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-4">
            <p className="text-sm text-blue-600">
              This will create:
            </p>
            <ul className="text-sm text-blue-600 mt-2 ml-4 space-y-1">
              <li>✓ 6 template categories (Landing Page, Event, Sales, Waitlist, Wedding, Newsletter)</li>
              <li>✓ 4 beautiful templates with HTML/CSS</li>
              <li>✓ Form fields for each template</li>
            </ul>
          </div>

          <button
            onClick={handleSeed}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Seeding...' : 'Seed Templates'}
          </button>

          {message && (
            <div className={`p-4 rounded-lg ${message.includes('✓') ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
