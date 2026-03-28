#!/usr/bin/env node
/**
 * The Tempo - Distribution Script
 * 
 * Publishes curated daily AI brief to multiple platforms:
 * - Discord community channels
 * - Email subscribers
 * - Telegram/WhatsApp feeds
 * - Notion public page
 */

const fs = require('fs');
const axios = require('axios');

class TempoDistributor {
  constructor(date = null) {
    this.date = date || new Date().toISOString().split('T')[0];
    this.curationPath = `data/curated/${this.date}-tempo.json`;
  }
  
  loadCuration() {
    if (!fs.existsSync(this.curationPath)) {
      throw new Error(`No curation file found for ${this.date}`);
    }
    
    const curation = JSON.parse(fs.readFileSync(this.curationPath, 'utf8'));
    const selectedStories = curation.suggested_stories.filter(s => s.selected);
    
    if (selectedStories.length === 0) {
      throw new Error(`No stories selected for ${this.date}`);
    }
    
    return { curation, selectedStories };
  }
  
  formatForDiscord() {
    const { curation, selectedStories } = this.loadCuration();
    
    let message = `🎼 **The Tempo** - AI News Brief\n`;
    message += `📅 ${new Date(this.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
    
    if (curation.curator_intro) {
      message += `${curation.curator_intro}\n\n`;
    }
    
    selectedStories.forEach((story, index) => {
      const emoji = this.getCategoryEmoji(story.suggested_category);
      message += `${emoji} **${story.title}**\n`;
      
      if (story.curator_angle) {
        message += `*${story.curator_angle}*\n`;
      }
      
      if (story.curator_note) {
        message += `${story.curator_note}\n`;
      }
      
      message += `🔗 [Read more](${story.link}) • ${story.source}\n\n`;
    });
    
    if (curation.curator_reflection) {
      message += `---\n💭 **MrHollandAI's Take:** ${curation.curator_reflection}\n\n`;
    }
    
    message += `📬 *Subscribe to our full newsletter for weekly deep dives*\n`;
    message += `🎵 *Composing your AI-powered future, one beat at a time*`;
    
    return message;
  }
  
  formatForEmail() {
    const { curation, selectedStories } = this.loadCuration();
    
    let html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333;">
      <header style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
        <h1 style="margin: 0; color: #2c3e50; font-size: 28px;">🎼 The Tempo</h1>
        <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 16px;">Daily AI News Brief</p>
        <p style="margin: 5px 0 0 0; color: #95a5a6; font-size: 14px;">${new Date(this.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>
    `;
    
    if (curation.curator_intro) {
      html += `<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; font-style: italic;">${curation.curator_intro}</div>`;
    }
    
    selectedStories.forEach((story, index) => {
      const emoji = this.getCategoryEmoji(story.suggested_category);
      html += `
      <article style="margin-bottom: 30px; padding-bottom: 25px; border-bottom: 1px solid #eee;">
        <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #2c3e50;">
          ${emoji} ${story.title}
        </h2>
      `;
      
      if (story.curator_angle) {
        html += `<p style="margin: 0 0 10px 0; font-weight: 500; color: #3498db; font-style: italic;">${story.curator_angle}</p>`;
      }
      
      if (story.curator_note) {
        html += `<p style="margin: 0 0 15px 0; color: #555;">${story.curator_note}</p>`;
      }
      
      html += `
        <div style="font-size: 14px; color: #7f8c8d;">
          <a href="${story.link}" style="color: #3498db; text-decoration: none; font-weight: 500;">Read full story</a>
          <span style="margin: 0 10px;">•</span>
          <span>${story.source}</span>
          <span style="margin: 0 10px;">•</span>
          <span>${new Date(story.published_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
        </div>
      </article>
      `;
    });
    
    if (curation.curator_reflection) {
      html += `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">💭 MrHollandAI's Take</h3>
        <p style="margin: 0; opacity: 0.95;">${curation.curator_reflection}</p>
      </div>
      `;
    }
    
    html += `
      <footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #f0f0f0; color: #7f8c8d; font-size: 14px;">
        <p style="margin: 0 0 10px 0;">📬 <strong>Want weekly deep dives?</strong> Subscribe to our full newsletter</p>
        <p style="margin: 0; font-style: italic;">🎵 Composing your AI-powered future, one beat at a time</p>
      </footer>
    </div>
    `;
    
    return {
      subject: `🎼 The Tempo: ${selectedStories.length} AI Stories for ${new Date(this.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      html: html,
      text: this.htmlToText(html)
    };
  }
  
  formatForNotion() {
    const { curation, selectedStories } = this.loadCuration();
    
    const notionBlocks = [
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{
            type: 'text',
            text: { content: `🎼 The Tempo - ${new Date(this.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` }
          }]
        }
      }
    ];
    
    if (curation.curator_intro) {
      notionBlocks.push({
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '👋' },
          rich_text: [{
            type: 'text',
            text: { content: curation.curator_intro }
          }]
        }
      });
    }
    
    selectedStories.forEach((story, index) => {
      const emoji = this.getCategoryEmoji(story.suggested_category);
      
      notionBlocks.push(
        {
          type: 'heading_2',
          heading_2: {
            rich_text: [{
              type: 'text',
              text: { content: `${emoji} ${story.title}` }
            }]
          }
        }
      );
      
      if (story.curator_angle) {
        notionBlocks.push({
          type: 'paragraph',
          paragraph: {
            rich_text: [{
              type: 'text',
              text: { content: story.curator_angle },
              annotations: { italic: true, color: 'blue' }
            }]
          }
        });
      }
      
      if (story.curator_note) {
        notionBlocks.push({
          type: 'paragraph',
          paragraph: {
            rich_text: [{
              type: 'text',
              text: { content: story.curator_note }
            }]
          }
        });
      }
      
      notionBlocks.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Read more' },
              href: story.link
            },
            {
              type: 'text',
              text: { content: ` • ${story.source}` }
            }
          ]
        }
      });
    });
    
    if (curation.curator_reflection) {
      notionBlocks.push(
        {
          type: 'divider',
          divider: {}
        },
        {
          type: 'callout',
          callout: {
            icon: { type: 'emoji', emoji: '💭' },
            rich_text: [
              {
                type: 'text',
                text: { content: 'MrHollandAI\'s Take: ' },
                annotations: { bold: true }
              },
              {
                type: 'text',
                text: { content: curation.curator_reflection }
              }
            ]
          }
        }
      );
    }
    
    return notionBlocks;
  }
  
  getCategoryEmoji(category) {
    const emojiMap = {
      'Government & Policy': '🏛️',
      'Funding & Business': '💰',
      'Tools & Products': '🔧',
      'Research & Breakthroughs': '🔬',
      'Reality Check': '🎯'
    };
    return emojiMap[category] || '📰';
  }
  
  htmlToText(html) {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }
  
  async distributeToDiscord(webhookUrl = null) {
    if (!webhookUrl) {
      console.log('⏭️  Skipping Discord - no webhook URL provided');
      return { success: false, reason: 'No webhook URL' };
    }
    
    try {
      const message = this.formatForDiscord();
      
      // Discord has a 2000 character limit, so we might need to split
      if (message.length > 2000) {
        const parts = this.splitMessage(message, 2000);
        for (const part of parts) {
          await axios.post(webhookUrl, { content: part });
          await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
        }
      } else {
        await axios.post(webhookUrl, { content: message });
      }
      
      console.log('✅ Distributed to Discord');
      return { success: true };
    } catch (error) {
      console.error('❌ Discord distribution failed:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  splitMessage(message, maxLength) {
    const parts = [];
    let current = '';
    const lines = message.split('\n');
    
    for (const line of lines) {
      if ((current + line + '\n').length > maxLength) {
        if (current) parts.push(current.trim());
        current = line + '\n';
      } else {
        current += line + '\n';
      }
    }
    
    if (current) parts.push(current.trim());
    return parts;
  }
  
  async generatePreview() {
    const { curation, selectedStories } = this.loadCuration();
    
    console.log('🎼 The Tempo Preview');
    console.log('='.repeat(50));
    console.log(`📅 Date: ${this.date}`);
    console.log(`📰 Stories: ${selectedStories.length}`);
    console.log('');
    
    selectedStories.forEach((story, index) => {
      const emoji = this.getCategoryEmoji(story.suggested_category);
      console.log(`${index + 1}. ${emoji} ${story.title}`);
      console.log(`   Source: ${story.source}`);
      if (story.curator_angle) {
        console.log(`   Angle: ${story.curator_angle}`);
      }
      console.log('');
    });
    
    if (curation.curator_reflection) {
      console.log('💭 MrHollandAI\'s Take:');
      console.log(curation.curator_reflection);
      console.log('');
    }
    
    return { curation, selectedStories };
  }
}

// CLI Interface
if (require.main === module) {
  const command = process.argv[2];
  const date = process.argv[3];
  
  const distributor = new TempoDistributor(date);
  
  switch (command) {
    case 'preview':
      try {
        distributor.generatePreview();
      } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
      break;
      
    case 'discord':
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL || process.argv[4];
      distributor.distributeToDiscord(webhookUrl)
        .then(result => {
          if (!result.success) {
            console.error('❌ Distribution failed:', result.reason || result.error);
            process.exit(1);
          }
        });
      break;
      
    case 'formats':
      try {
        console.log('🎼 The Tempo - Format Examples');
        console.log('');
        
        console.log('📧 EMAIL FORMAT:');
        console.log('Subject:', distributor.formatForEmail().subject);
        console.log('');
        
        console.log('💬 DISCORD FORMAT (first 500 chars):');
        console.log(distributor.formatForDiscord().substring(0, 500) + '...');
        console.log('');
        
        console.log('📝 NOTION BLOCKS:', distributor.formatForNotion().length, 'blocks');
        
      } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
      break;
      
    default:
      console.log('🎼 The Tempo - Distribution Tool');
      console.log('');
      console.log('Usage:');
      console.log('  node scripts/distribute-tempo.js preview [date]');
      console.log('  node scripts/distribute-tempo.js discord [date] [webhook-url]');
      console.log('  node scripts/distribute-tempo.js formats [date]');
      console.log('');
      console.log('Environment variables:');
      console.log('  DISCORD_WEBHOOK_URL - Discord webhook for posting');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/distribute-tempo.js preview');
      console.log('  node scripts/distribute-tempo.js discord');
      console.log('  node scripts/distribute-tempo.js formats 2026-03-28');
  }
}

module.exports = { TempoDistributor };
