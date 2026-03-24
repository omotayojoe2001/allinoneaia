import { supabase } from '@/lib/supabase';

// Beautiful free HTML templates - these are simplified versions
// In production, you'd fetch from template libraries or use full template code

const templateCategories = [
  { name: 'Landing Page', slug: 'landing-page', icon: 'Zap' },
  { name: 'Event', slug: 'event', icon: 'Calendar' },
  { name: 'Sales', slug: 'sales', icon: 'TrendingUp' },
  { name: 'Waitlist', slug: 'waitlist', icon: 'Clock' },
  { name: 'Wedding', slug: 'wedding', icon: 'Heart' },
  { name: 'Newsletter', slug: 'newsletter', icon: 'Mail' },
];

const templates = [
  {
    category: 'landing-page',
    name: 'Modern SaaS Landing',
    slug: 'modern-saas',
    description: 'Clean and modern landing page for SaaS products',
    thumbnail: 'https://via.placeholder.com/400x300?text=Modern+SaaS',
    preview: 'https://via.placeholder.com/1200x800?text=Modern+SaaS+Preview',
    html: `
      <div class="landing-page">
        <header class="navbar">
          <div class="container">
            <div class="logo">YourBrand</div>
            <nav>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#contact">Contact</a>
            </nav>
          </div>
        </header>

        <section class="hero">
          <div class="container">
            <h1>The Future of Your Business Starts Here</h1>
            <p>Build, launch, and scale your business with our powerful platform</p>
            <button class="cta-button">Get Started Free</button>
          </div>
        </section>

        <section id="features" class="features">
          <div class="container">
            <h2>Powerful Features</h2>
            <div class="features-grid">
              <div class="feature-card">
                <h3>Fast & Reliable</h3>
                <p>Lightning-fast performance with 99.9% uptime</p>
              </div>
              <div class="feature-card">
                <h3>Easy to Use</h3>
                <p>Intuitive interface that anyone can master</p>
              </div>
              <div class="feature-card">
                <h3>24/7 Support</h3>
                <p>Our team is always here to help you succeed</p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" class="pricing">
          <div class="container">
            <h2>Simple Pricing</h2>
            <div class="pricing-grid">
              <div class="pricing-card">
                <h3>Starter</h3>
                <p class="price">$29/mo</p>
                <ul>
                  <li>Up to 10 projects</li>
                  <li>Basic support</li>
                  <li>1GB storage</li>
                </ul>
              </div>
              <div class="pricing-card featured">
                <h3>Professional</h3>
                <p class="price">$79/mo</p>
                <ul>
                  <li>Unlimited projects</li>
                  <li>Priority support</li>
                  <li>100GB storage</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" class="contact">
          <div class="container">
            <h2>Get In Touch</h2>
            <form class="contact-form">
              <input type="text" placeholder="Your Name" required>
              <input type="email" placeholder="Your Email" required>
              <textarea placeholder="Your Message" required></textarea>
              <button type="submit">Send Message</button>
            </form>
          </div>
        </section>

        <footer>
          <div class="container">
            <p>&copy; 2024 YourBrand. All rights reserved.</p>
          </div>
        </footer>
      </div>
    `,
    css: `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
      
      .navbar { background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 100; }
      .navbar .container { display: flex; justify-content: space-between; align-items: center; padding: 1rem 20px; }
      .logo { font-size: 1.5rem; font-weight: bold; color: #007bff; }
      nav { display: flex; gap: 2rem; }
      nav a { text-decoration: none; color: #333; transition: color 0.3s; }
      nav a:hover { color: #007bff; }
      
      .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 100px 20px; text-align: center; }
      .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
      .hero p { font-size: 1.2rem; margin-bottom: 2rem; }
      .cta-button { background: white; color: #667eea; padding: 12px 30px; border: none; border-radius: 5px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: transform 0.3s; }
      .cta-button:hover { transform: scale(1.05); }
      
      .features { padding: 80px 20px; background: #f8f9fa; }
      .features h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
      .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
      .feature-card { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
      .feature-card h3 { color: #667eea; margin-bottom: 1rem; }
      
      .pricing { padding: 80px 20px; }
      .pricing h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
      .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
      .pricing-card { border: 2px solid #ddd; padding: 2rem; border-radius: 10px; text-align: center; transition: transform 0.3s; }
      .pricing-card:hover { transform: translateY(-10px); }
      .pricing-card.featured { border-color: #667eea; background: #f0f4ff; }
      .pricing-card h3 { margin-bottom: 1rem; }
      .price { font-size: 2rem; color: #667eea; font-weight: bold; margin-bottom: 1rem; }
      .pricing-card ul { list-style: none; text-align: left; }
      .pricing-card li { padding: 0.5rem 0; border-bottom: 1px solid #eee; }
      
      .contact { padding: 80px 20px; background: #f8f9fa; }
      .contact h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
      .contact-form { max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
      .contact-form input, .contact-form textarea { padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-family: inherit; }
      .contact-form button { background: #667eea; color: white; padding: 12px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
      .contact-form button:hover { background: #764ba2; }
      
      footer { background: #333; color: white; text-align: center; padding: 2rem; }
      
      @media (max-width: 768px) {
        .hero h1 { font-size: 2rem; }
        nav { gap: 1rem; }
      }
    `,
    formFields: [
      { id: 'name', name: 'name', label: 'Full Name', type: 'text', required: true },
      { id: 'email', name: 'email', label: 'Email', type: 'email', required: true },
      { id: 'message', name: 'message', label: 'Message', type: 'textarea', required: true },
    ],
  },
  {
    category: 'event',
    name: 'Event Registration',
    slug: 'event-registration',
    description: 'Beautiful event registration page with countdown timer',
    thumbnail: 'https://via.placeholder.com/400x300?text=Event+Registration',
    preview: 'https://via.placeholder.com/1200x800?text=Event+Preview',
    html: `
      <div class="event-page">
        <header class="event-header">
          <div class="container">
            <h1>Annual Tech Conference 2024</h1>
            <p>Join us for the biggest tech event of the year</p>
          </div>
        </header>

        <section class="event-details">
          <div class="container">
            <div class="details-grid">
              <div class="detail-item">
                <h3>📅 Date</h3>
                <p>June 15-17, 2024</p>
              </div>
              <div class="detail-item">
                <h3>📍 Location</h3>
                <p>Convention Center, City</p>
              </div>
              <div class="detail-item">
                <h3>👥 Attendees</h3>
                <p>500+ Expected</p>
              </div>
            </div>
          </div>
        </section>

        <section class="registration">
          <div class="container">
            <h2>Register Now</h2>
            <form class="registration-form">
              <input type="text" placeholder="Full Name" required>
              <input type="email" placeholder="Email Address" required>
              <input type="tel" placeholder="Phone Number" required>
              <select required>
                <option>Select Ticket Type</option>
                <option>Early Bird - $99</option>
                <option>Regular - $149</option>
                <option>VIP - $299</option>
              </select>
              <button type="submit">Register Now</button>
            </form>
          </div>
        </section>
      </div>
    `,
    css: `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
      
      .event-header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 100px 20px; text-align: center; }
      .event-header h1 { font-size: 3rem; margin-bottom: 1rem; }
      .event-header p { font-size: 1.3rem; }
      
      .event-details { padding: 60px 20px; background: #f8f9fa; }
      .details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }
      .detail-item { background: white; padding: 2rem; border-radius: 10px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
      .detail-item h3 { color: #f5576c; margin-bottom: 1rem; font-size: 1.3rem; }
      
      .registration { padding: 80px 20px; }
      .registration h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
      .registration-form { max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
      .registration-form input, .registration-form select { padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-family: inherit; font-size: 1rem; }
      .registration-form button { background: #f5576c; color: white; padding: 12px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 1rem; }
      .registration-form button:hover { background: #f093fb; }
    `,
    formFields: [
      { id: 'name', name: 'name', label: 'Full Name', type: 'text', required: true },
      { id: 'email', name: 'email', label: 'Email', type: 'email', required: true },
      { id: 'phone', name: 'phone', label: 'Phone', type: 'phone', required: true },
      { id: 'ticket', name: 'ticket', label: 'Ticket Type', type: 'select', required: true, options: ['Early Bird - $99', 'Regular - $149', 'VIP - $299'] },
    ],
  },
  {
    category: 'sales',
    name: 'Product Sales Page',
    slug: 'product-sales',
    description: 'High-converting sales page for digital products',
    thumbnail: 'https://via.placeholder.com/400x300?text=Sales+Page',
    preview: 'https://via.placeholder.com/1200x800?text=Sales+Preview',
    html: `
      <div class="sales-page">
        <section class="hero">
          <div class="container">
            <h1>Transform Your Business Today</h1>
            <p>Get instant access to our premium toolkit</p>
            <button class="cta">Buy Now - $97</button>
          </div>
        </section>

        <section class="benefits">
          <div class="container">
            <h2>What You'll Get</h2>
            <ul class="benefits-list">
              <li>✓ Complete training modules</li>
              <li>✓ Lifetime access</li>
              <li>✓ 30-day money-back guarantee</li>
              <li>✓ Private community access</li>
              <li>✓ Weekly live sessions</li>
              <li>✓ Email support</li>
            </ul>
          </div>
        </section>

        <section class="testimonials">
          <div class="container">
            <h2>What Customers Say</h2>
            <div class="testimonials-grid">
              <div class="testimonial">
                <p>"This changed my business completely!"</p>
                <p class="author">- John Doe</p>
              </div>
              <div class="testimonial">
                <p>"Best investment I've made this year."</p>
                <p class="author">- Jane Smith</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    `,
    css: `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
      
      .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 120px 20px; text-align: center; }
      .hero h1 { font-size: 3.5rem; margin-bottom: 1rem; }
      .hero p { font-size: 1.3rem; margin-bottom: 2rem; }
      .cta { background: #ffd700; color: #333; padding: 15px 40px; border: none; border-radius: 5px; font-size: 1.1rem; font-weight: bold; cursor: pointer; }
      .cta:hover { background: #ffed4e; }
      
      .benefits { padding: 80px 20px; background: #f8f9fa; }
      .benefits h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
      .benefits-list { max-width: 600px; margin: 0 auto; list-style: none; font-size: 1.1rem; }
      .benefits-list li { padding: 1rem 0; border-bottom: 1px solid #ddd; }
      
      .testimonials { padding: 80px 20px; }
      .testimonials h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
      .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
      .testimonial { background: #f0f4ff; padding: 2rem; border-radius: 10px; border-left: 4px solid #667eea; }
      .testimonial p { margin-bottom: 1rem; }
      .author { font-weight: bold; color: #667eea; }
    `,
    formFields: [],
  },
  {
    category: 'waitlist',
    name: 'Waitlist Signup',
    slug: 'waitlist-signup',
    description: 'Simple and elegant waitlist page',
    thumbnail: 'https://via.placeholder.com/400x300?text=Waitlist',
    preview: 'https://via.placeholder.com/1200x800?text=Waitlist+Preview',
    html: `
      <div class="waitlist-page">
        <section class="waitlist-hero">
          <div class="container">
            <h1>Coming Soon</h1>
            <p>Something amazing is on the way</p>
            <form class="waitlist-form">
              <input type="email" placeholder="Enter your email" required>
              <button type="submit">Join Waitlist</button>
            </form>
            <p class="form-note">Be the first to know when we launch</p>
          </div>
        </section>
      </div>
    `,
    css: `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 0 20px; }
      
      .waitlist-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      .waitlist-hero { color: white; text-align: center; }
      .waitlist-hero h1 { font-size: 3rem; margin-bottom: 1rem; }
      .waitlist-hero p { font-size: 1.2rem; margin-bottom: 2rem; }
      
      .waitlist-form { display: flex; gap: 1rem; margin-bottom: 1rem; }
      .waitlist-form input { flex: 1; padding: 12px; border: none; border-radius: 5px; font-size: 1rem; }
      .waitlist-form button { padding: 12px 30px; background: #ffd700; color: #333; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; }
      .waitlist-form button:hover { background: #ffed4e; }
      
      .form-note { font-size: 0.9rem; opacity: 0.9; }
      
      @media (max-width: 768px) {
        .waitlist-form { flex-direction: column; }
        .waitlist-hero h1 { font-size: 2rem; }
      }
    `,
    formFields: [
      { id: 'email', name: 'email', label: 'Email', type: 'email', required: true },
    ],
  },
];

export async function seedTemplates() {
  try {
    console.log('Starting template seeding...');

    // Seed categories
    for (const category of templateCategories) {
      const { error } = await supabase
        .from('template_categories')
        .insert([category])
        .select();

      if (error && error.code !== '23505') {
        console.error(`Error inserting category ${category.name}:`, error);
      } else {
        console.log(`✓ Category: ${category.name}`);
      }
    }

    // Seed templates
    for (const template of templates) {
      const { data: category } = await supabase
        .from('template_categories')
        .select('id')
        .eq('slug', template.category)
        .single();

      if (!category) {
        console.error(`Category not found for ${template.category}`);
        continue;
      }

      const { error } = await supabase
        .from('templates')
        .insert([
          {
            category_id: category.id,
            name: template.name,
            slug: template.slug,
            description: template.description,
            thumbnail_url: template.thumbnail,
            preview_url: template.preview,
            html_content: template.html,
            css_content: template.css,
            form_fields: template.formFields,
            is_active: true,
          },
        ])
        .select();

      if (error && error.code !== '23505') {
        console.error(`Error inserting template ${template.name}:`, error);
      } else {
        console.log(`✓ Template: ${template.name}`);
      }
    }

    console.log('✓ Template seeding completed!');
  } catch (error) {
    console.error('Seeding error:', error);
  }
}
