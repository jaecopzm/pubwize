"use client";

import { useState, useEffect } from "react";
import { Settings, Tag, FolderTree, Eye, Search, X } from "lucide-react";
import { toast } from "sonner";
import { getFirebaseAuth } from "@/lib/firebase-client";

interface WordPressPublishSettingsProps {
  articleId: string;
  wordPressSiteId: string;
  onSave: (settings: PublishSettings) => void;
}

interface PublishSettings {
  publishStatus: 'draft' | 'publish' | 'pending';
  wpCategories: number[];
  wpTags: number[];
  focusKeyword: string;
  metaDescription: string;
  seoTitle: string;
  excerpt: string;
}

interface WPCategory {
  id: number;
  name: string;
  slug: string;
}

interface WPTag {
  id: number;
  name: string;
  slug: string;
}

export function WordPressPublishSettings({
  articleId,
  wordPressSiteId,
  onSave,
}: WordPressPublishSettingsProps) {
  const [settings, setSettings] = useState<PublishSettings>({
    publishStatus: 'draft',
    wpCategories: [],
    wpTags: [],
    focusKeyword: '',
    metaDescription: '',
    seoTitle: '',
    excerpt: '',
  });

  const [categories, setCategories] = useState<WPCategory[]>([]);
  const [tags, setTags] = useState<WPTag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWordPressData();
  }, [wordPressSiteId]);

  async function fetchWordPressData() {
    try {
      const auth = getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) return;

      // Fetch categories and tags from WordPress
      const [categoriesRes, tagsRes] = await Promise.all([
        fetch(`/api/wordpress/categories?siteId=${wordPressSiteId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
        fetch(`/api/wordpress/tags?siteId=${wordPressSiteId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
      ]);

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }

      if (tagsRes.ok) {
        const data = await tagsRes.json();
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error('Error fetching WordPress data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleAddTag() {
    if (!newTag.trim()) return;
    
    // Create new tag (will be created in WordPress on publish)
    const tagId = Date.now(); // Temporary ID
    setTags([...tags, { id: tagId, name: newTag, slug: newTag.toLowerCase().replace(/\s+/g, '-') }]);
    setSettings({ ...settings, wpTags: [...settings.wpTags, tagId] });
    setNewTag('');
  }

  function handleSave() {
    onSave(settings);
    toast.success('Publish settings saved');
  }

  return (
    <div className="space-y-6">
      {/* Publish Status */}
      <div>
        <label className="font-mono-dm text-xs font-medium uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-3)' }}>
          <Eye className="h-3 w-3 inline mr-1" />
          Publish Status
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'draft', label: 'Draft', color: 'var(--gold)' },
            { value: 'pending', label: 'Pending Review', color: 'var(--lilac)' },
            { value: 'publish', label: 'Publish', color: 'var(--teal)' },
          ].map((status) => (
            <button
              key={status.value}
              onClick={() => setSettings({ ...settings, publishStatus: status.value as any })}
              className="p-3 rounded-xl border text-sm font-semibold transition-all"
              style={{
                borderColor: settings.publishStatus === status.value ? `${status.color}40` : 'rgba(255,255,255,0.06)',
                background: settings.publishStatus === status.value ? `${status.color}15` : 'var(--surface-2)',
                color: settings.publishStatus === status.value ? status.color : 'var(--text-2)',
              }}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="font-mono-dm text-xs font-medium uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-3)' }}>
          <FolderTree className="h-3 w-3 inline mr-1" />
          Categories
        </label>
        <div className="space-y-2 max-h-40 overflow-y-auto p-3 rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'var(--surface-2)' }}>
          {loading ? (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>No categories found</p>
          ) : (
            categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.wpCategories.includes(cat.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSettings({ ...settings, wpCategories: [...settings.wpCategories, cat.id] });
                    } else {
                      setSettings({ ...settings, wpCategories: settings.wpCategories.filter(id => id !== cat.id) });
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: 'var(--text-1)' }}>{cat.name}</span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="font-mono-dm text-xs font-medium uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-3)' }}>
          <Tag className="h-3 w-3 inline mr-1" />
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Add tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            className="flex-1 h-10 px-3 rounded-xl border text-sm"
            style={{ 
              borderColor: 'rgba(255,255,255,0.06)', 
              background: 'var(--surface-2)',
              color: 'var(--text-1)'
            }}
          />
          <button onClick={handleAddTag} className="btn-gold text-xs px-4">
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {settings.wpTags.map((tagId) => {
            const tag = tags.find(t => t.id === tagId);
            if (!tag) return null;
            return (
              <span
                key={tagId}
                className="badge-gold flex items-center gap-1 cursor-pointer"
                onClick={() => setSettings({ ...settings, wpTags: settings.wpTags.filter(id => id !== tagId) })}
              >
                {tag.name}
                <X className="h-3 w-3" />
              </span>
            );
          })}
        </div>
      </div>

      {/* SEO Settings */}
      <div className="space-y-3">
        <label className="font-mono-dm text-xs font-medium uppercase tracking-widest block" style={{ color: 'var(--text-3)' }}>
          <Search className="h-3 w-3 inline mr-1" />
          SEO Settings
        </label>
        
        <input
          type="text"
          placeholder="Focus Keyword"
          value={settings.focusKeyword}
          onChange={(e) => setSettings({ ...settings, focusKeyword: e.target.value })}
          className="w-full h-10 px-3 rounded-xl border text-sm"
          style={{ 
            borderColor: 'rgba(255,255,255,0.06)', 
            background: 'var(--surface-2)',
            color: 'var(--text-1)'
          }}
        />

        <input
          type="text"
          placeholder="SEO Title"
          value={settings.seoTitle}
          onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
          className="w-full h-10 px-3 rounded-xl border text-sm"
          style={{ 
            borderColor: 'rgba(255,255,255,0.06)', 
            background: 'var(--surface-2)',
            color: 'var(--text-1)'
          }}
        />

        <textarea
          placeholder="Meta Description"
          value={settings.metaDescription}
          onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
          style={{ 
            borderColor: 'rgba(255,255,255,0.06)', 
            background: 'var(--surface-2)',
            color: 'var(--text-1)'
          }}
        />

        <textarea
          placeholder="Excerpt"
          value={settings.excerpt}
          onChange={(e) => setSettings({ ...settings, excerpt: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
          style={{ 
            borderColor: 'rgba(255,255,255,0.06)', 
            background: 'var(--surface-2)',
            color: 'var(--text-1)'
          }}
        />
      </div>

      <button onClick={handleSave} className="btn-gold w-full">
        <Settings className="h-4 w-4" />
        Save Settings
      </button>
    </div>
  );
}
