#!/usr/bin/env node
/**
 * The Tempo - Daily AI News Curation Script
 * 
 * This script helps curate the daily AI news gathered by automation
 * into 3-5 key stories for "The Tempo" daily brief.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MAX_STORIES = 5;
const MIN_STORIES = 3;

// Categories for organizing stories
const CATEGORIES = {
  POLICY: 'Government & Policy',
  FUNDING: 'Funding & Business',
  TOOLS: 'Tools & Products', 
  RESEARCH: 'Research & Breakthroughs',
  HYPE_CHECK: 'Reality Check'
};

class TempoCurator {
  constructor(date = null) {
    this.date = date || new Date().toISOString().split('T')[0];
    this.dataPath = `data/daily-news/${this.date}.json`;
    this.outputPath = `data/curated/${this.date}-tempo.json`;
  }
  
  loadRawData() {
    if (!fs.existsSync(this.dataPath)) {
      throw new Error(`No raw data found for ${this.date}. Run the news gathering first.`);
    }
    
    const rawData = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
    console.log(`📊 Loaded ${rawData.total_articles} articles from ${this.date}`);
    
    // Combine all sources into a single array with source tags
    const allArticles = [
      ...rawData.sources.general_ai.map(a => ({...a, source_type: 'general'})),
      ...rawData.sources.startup_funding.map(a => ({...a, source_type: 'funding'})),
      ...rawData.sources.tools_releases.map(a => ({...a, source_type: 'tools'}))
    ];
    
    return {
      raw: rawData,
      articles: allArticles
    };
  }
  
  suggestTopStories(articles) {
    // Score articles based on recency, source credibility, and relevance
    const scoredArticles = articles.map(article => {
      let score = 0;
      
      // Recency bonus (newer = higher score)
      const hoursAgo = (new Date() - new Date(article.published_at)) / (1000 * 60 * 60);
      if (hoursAgo < 6) score += 10;
      else if (hoursAgo < 12) score += 7;
      else if (hoursAgo < 24) score += 5;
      
      // Source credibility (simple heuristic)
      const credibleSources = ['Reuters', 'Bloomberg', 'TechCrunch', 'VentureBeat', 'MIT Technology Review'];
      if (credibleSources.some(source => article.source.includes(source))) {
        score += 8;
      }
      
      // Keywords that indicate important stories
      const importantKeywords = ['breakthrough', 'billion', 'policy', 'regulation', 'launch', 'funding'];
      const titleLower = article.title.toLowerCase();
      importantKeywords.forEach(keyword => {
        if (titleLower.includes(keyword)) score += 3;
      });
      
      // Avoid fluff/hype
      const hypeKeywords = ['revolutionary', 'game-changing', 'unprecedented'];
      hypeKeywords.forEach(keyword => {
        if (titleLower.includes(keyword)) score -= 2;
      });
      
      return { ...article, score };
    });
    
    // Sort by score and return top candidates
    return scoredArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_STORIES * 2); // Get twice as many for manual selection
  }
  
  categorizeStory(article) {
    const title = article.title.toLowerCase();
    const snippet = article.snippet.toLowerCase();
    const text = title + ' ' + snippet;
    
    if (text.includes('policy') || text.includes('regulation') || text.includes('government')) {
      return CATEGORIES.POLICY;
    }
    if (text.includes('funding') || text.includes('investment') || text.includes('billion') || text.includes('startup')) {
      return CATEGORIES.FUNDING;
    }
    if (text.includes('tool') || text.includes('product') || text.includes('launch') || text.includes('release')) {
      return CATEGORIES.TOOLS;
    }
    if (text.includes('research') || text.includes('study') || text.includes('breakthrough')) {
      return CATEGORIES.RESEARCH;
    }
    
    return CATEGORIES.HYPE_CHECK; // Default for stories that need reality checking
  }
  
  generateCurationTemplate() {
    const data = this.loadRawData();
    const topStories = this.suggestTopStories(data.articles);
    
    const template = {
      date: this.date,
      timestamp: new Date().toISOString(),
      status: 'pending_curation',
      suggested_stories: topStories.map((article, index) => ({
        id: index + 1,
        title: article.title,
        source: article.source,
        link: article.link,
        snippet: article.snippet,
        published_at: article.published_at,
        suggested_category: this.categorizeStory(article),
        score: article.score,
        selected: false, // Manual curation flag
        curator_note: '', // For adding MrHollandAI perspective
        curator_angle: '' // The unique angle/insight to highlight
      })),
      curated_stories: [], // Will be populated after manual selection
      curator_intro: '', // Daily intro message
      curator_reflection: '', // End-of-brief reflection
      distribution: {
        discord: false,
        email: false,
        notion: false
      }
    };
    
    // Ensure curated directory exists
    if (!fs.existsSync('data/curated')) {
      fs.mkdirSync('data/curated', { recursive: true });
    }
    
    fs.writeFileSync(this.outputPath, JSON.stringify(template, null, 2));
    
    console.log(`✅ Generated curation template: ${this.outputPath}`);
    console.log(`📝 Suggested ${topStories.length} stories for manual curation`);
    console.log('');
    console.log('🎼 Next steps:');
    console.log('1. Review suggested_stories in the JSON file');
    console.log('2. Set selected: true for 3-5 best stories');
    console.log('3. Add curator_note and curator_angle for each selected story');
    console.log('4. Write curator_intro and curator_reflection');
    console.log('5. Run distribution script when ready');
    
    return template;
  }
  
  validateCuration() {
    if (!fs.existsSync(this.outputPath)) {
      throw new Error(`No curation file found for ${this.date}`);
    }
    
    const curation = JSON.parse(fs.readFileSync(this.outputPath, 'utf8'));
    const selectedStories = curation.suggested_stories.filter(s => s.selected);
    
    if (selectedStories.length < MIN_STORIES) {
      throw new Error(`Need at least ${MIN_STORIES} selected stories, found ${selectedStories.length}`);
    }
    
    if (selectedStories.length > MAX_STORIES) {
      throw new Error(`Too many selected stories: ${selectedStories.length} (max ${MAX_STORIES})`);
    }
    
    const incompleteStories = selectedStories.filter(s => !s.curator_note || !s.curator_angle);
    if (incompleteStories.length > 0) {
      throw new Error(`${incompleteStories.length} selected stories missing curator notes or angles`);
    }
    
    console.log('✅ Curation validation passed!');
    return { curation, selectedStories };
  }
}

// CLI Interface
if (require.main === module) {
  const command = process.argv[2];
  const date = process.argv[3];
  
  const curator = new TempoCurator(date);
  
  switch (command) {
    case 'generate':
      try {
        curator.generateCurationTemplate();
      } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
      break;
      
    case 'validate':
      try {
        curator.validateCuration();
      } catch (error) {
        console.error('❌ Validation failed:', error.message);
        process.exit(1);
      }
      break;
      
    default:
      console.log('🎼 The Tempo - AI News Curation Tool');
      console.log('');
      console.log('Usage:');
      console.log('  node scripts/curate-tempo.js generate [date]');
      console.log('  node scripts/curate-tempo.js validate [date]');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/curate-tempo.js generate');
      console.log('  node scripts/curate-tempo.js generate 2026-03-28');
      console.log('  node scripts/curate-tempo.js validate');
  }
}

module.exports = { TempoCurator, CATEGORIES };
