"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Clock, Grid3x3, List, Search, TrendingUp, BarChart3 } from 'lucide-react';
import type { CalendarEvent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_OF_WEEK_MOBILE = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type ViewMode = 'month' | 'week' | 'list';
type FilterType = 'all' | 'draft' | 'optimized';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [unscheduledArticles, setUnscheduledArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchEvents();
    fetchUnscheduledArticles();
  }, [year, month]);

  async function fetchEvents() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/calendar?year=${year}&month=${month + 1}`,
        {
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }

  async function fetchUnscheduledArticles() {
    try {

      const response = await fetch('/api/articles', {});

      if (response.ok) {
        const data = await response.json();
        const unscheduled = data.articles.filter((a: any) => 
          !a.scheduledDate && (a.status === 'draft' || a.status === 'optimized')
        );
        setUnscheduledArticles(unscheduled);
      }
    } catch (error) {
      console.error('Error fetching unscheduled articles:', error);
    }
  }

  async function scheduleArticle(articleId: string, date: Date) {
    try {

      const response = await fetch('/api/calendar/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId, date: date.toISOString() }),
      });

      if (!response.ok) throw new Error('Failed to schedule');

      toast.success('Article scheduled successfully');
      fetchEvents();
      fetchUnscheduledArticles();
      setShowScheduleModal(false);
    } catch (error) {
      toast.error('Failed to schedule article');
    }
  }

  async function unscheduleArticle(articleId: string) {
    try {

      const response = await fetch('/api/calendar/unschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId }),
      });

      if (!response.ok) throw new Error('Failed to unschedule');

      toast.success('Article unscheduled');
      fetchEvents();
      fetchUnscheduledArticles();
    } catch (error) {
      toast.error('Failed to unschedule article');
    }
  }

  function goToPreviousMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function goToNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  // Get calendar grid data
  function getCalendarDays() {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{ date: number; isCurrentMonth: boolean; events: CalendarEvent[] }> = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonthLastDay - i,
        isCurrentMonth: false,
        events: [],
      });
    }

    // Current month days
    for (let date = 1; date <= daysInMonth; date++) {
      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.scheduledDate);
        return (
          eventDate.getFullYear() === year &&
          eventDate.getMonth() === month &&
          eventDate.getDate() === date
        );
      });

      days.push({
        date,
        isCurrentMonth: true,
        events: dayEvents,
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let date = 1; date <= remainingDays; date++) {
      days.push({
        date,
        isCurrentMonth: false,
        events: [],
      });
    }

    return days;
  }

  const calendarDays = getCalendarDays();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Filter events based on search and filter type
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || event.status === filterType;
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats = {
    total: events.length,
    draft: events.filter(e => e.status === 'draft').length,
    optimized: events.filter(e => e.status === 'optimized').length,
    thisWeek: events.filter(e => {
      const eventDate = new Date(e.scheduledDate);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      return eventDate >= weekStart && eventDate < weekEnd;
    }).length,
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full aurora-bg noise-overlay min-h-screen">
      {/* Main Calendar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8 gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15">
              <CalendarIcon className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Content <span className="gradient-gold-teal">Calendar</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Plan and schedule your content pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-muted-foreground transition-all hover:border-gold/30 hover:text-foreground shadow-sm"
            >
              Today
            </button>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="lg:hidden flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-gold/30 hover:text-foreground"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">{unscheduledArticles.length}</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 relative z-10">
          <div className="card-premium p-3 lg:p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-gold" />
              <span className="font-mono-dm text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">Total</span>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="card-premium p-3 lg:p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-teal" />
              <span className="font-mono-dm text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">This Week</span>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-foreground">{stats.thisWeek}</p>
          </div>
          <div className="card-premium p-3 lg:p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-gold" />
              <span className="font-mono-dm text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">Draft</span>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-foreground">{stats.draft}</p>
          </div>
          <div className="card-premium p-3 lg:p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-teal" />
              <span className="font-mono-dm text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">Optimized</span>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-foreground">{stats.optimized}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 lg:mb-6 relative z-10">
          {/* Month Navigation */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <h2 className="font-display text-lg sm:text-xl lg:text-2xl font-semibold text-foreground">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:border-gold/30 hover:text-gold"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goToNextMonth}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:border-gold/30 hover:text-gold"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* View Mode & Filters */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-card/50">
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  viewMode === 'month' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid3x3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Month</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  viewMode === 'list' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-card/50">
              <button
                onClick={() => setFilterType('all')}
                className={cn(
                  "px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                  filterType === 'all' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('draft')}
                className={cn(
                  "px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                  filterType === 'draft' ? "bg-gold text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Draft
              </button>
              <button
                onClick={() => setFilterType('optimized')}
                className={cn(
                  "px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                  filterType === 'optimized' ? "bg-teal text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Optimized
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4 lg:mb-6 z-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search scheduled articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>

        {/* Calendar Grid or List View */}
        {loading ? (
          <div className="flex-1 border border-border rounded-xl lg:rounded-2xl overflow-hidden shadow-premium relative z-10" style={{ height: 'calc(100vh - 520px)', minHeight: '400px' }}>
            {/* Day headers skeleton */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
              {DAYS_OF_WEEK.map((day, i) => (
                <div
                  key={day}
                  className="font-mono-dm p-2 sm:p-3 lg:p-4 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground"
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{DAYS_OF_WEEK_MOBILE[i]}</span>
                </div>
              ))}
            </div>

            {/* Calendar days skeleton */}
            <div className="grid grid-cols-7 overflow-y-auto" style={{ height: 'calc(100% - 49px)', gridTemplateRows: 'repeat(6, 1fr)' }}>
              {[...Array(42)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "border-r border-b border-border p-1.5 sm:p-2 lg:p-3",
                    i % 7 === 6 && "border-r-0"
                  )}
                >
                  <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 sm:h-6 rounded-md" />
                    <Skeleton className="h-5 sm:h-6 rounded-md w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2 relative z-10">
            {filteredEvents.length === 0 ? (
              <div className="card-premium p-8 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No scheduled articles found</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="card-premium p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground mb-1 truncate">{event.title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono-dm text-xs text-muted-foreground">
                        {new Date(event.scheduledDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                      <span className={cn(
                        "font-mono-dm text-[10px] px-2 py-0.5 rounded border",
                        event.status === 'optimized' 
                          ? "bg-teal/10 text-teal border-teal/20" 
                          : "bg-gold/10 text-gold border-gold/20"
                      )}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Unschedule this article?')) {
                        unscheduleArticle(event.articleId);
                      }
                    }}
                    className="flex-shrink-0 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex-1 border border-border rounded-xl lg:rounded-2xl overflow-hidden shadow-premium relative z-10" style={{ height: 'calc(100vh - 520px)', minHeight: '400px' }}>
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
              {DAYS_OF_WEEK.map((day, i) => (
                <div
                  key={day}
                  className="font-mono-dm p-2 sm:p-3 lg:p-4 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground"
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{DAYS_OF_WEEK_MOBILE[i]}</span>
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 overflow-y-auto" style={{ height: 'calc(100% - 49px)', gridTemplateRows: 'repeat(6, 1fr)' }}>
              {calendarDays.map((day, index) => {
                const isToday =
                  isCurrentMonth &&
                  day.isCurrentMonth &&
                  day.date === today.getDate();

                const dayFilteredEvents = day.events.filter(event => {
                  const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesFilter = filterType === 'all' || event.status === filterType;
                  return matchesSearch && matchesFilter;
                });

                return (
                  <div
                    key={index}
                    className={cn(
                      "border-r border-b border-border p-1.5 sm:p-2 lg:p-3 transition-colors overflow-y-auto cursor-pointer hover:bg-gold/5",
                      !day.isCurrentMonth && "opacity-40 bg-muted/20",
                      index % 7 === 6 && "border-r-0"
                    )}
                    onClick={() => {
                      if (day.isCurrentMonth) {
                        setSelectedDate(new Date(year, month, day.date));
                        setShowScheduleModal(true);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        "text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-foreground",
                        isToday && "flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold/80 shadow-gold text-[#0a0700] dark:text-white"
                      )}
                    >
                      {day.date}
                    </div>

                    {/* Events for this day */}
                    <div className="space-y-1">
                      {dayFilteredEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "font-mono-dm text-[9px] sm:text-xs p-1 sm:p-1.5 rounded-md truncate cursor-pointer transition-all font-medium border group",
                            event.status === 'optimized' 
                              ? "bg-teal/10 text-teal border-teal/20 hover:bg-teal/20" 
                              : "bg-gold/10 text-gold border-gold/20 hover:bg-gold/20"
                          )}
                          title={event.title}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Unschedule this article?')) {
                              unscheduleArticle(event.articleId);
                            }
                          }}
                        >
                          <span className="hidden sm:inline">{event.title}</span>
                          <span className="sm:hidden">•</span>
                        </div>
                      ))}
                      {dayFilteredEvents.length > 3 && (
                        <div className="font-mono-dm text-[9px] sm:text-xs font-medium pl-1 text-muted-foreground">
                          +{dayFilteredEvents.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Unscheduled Articles */}
      <div className={cn(
        "w-full lg:w-80 relative z-10 flex flex-col",
        showSidebar ? "block" : "hidden lg:block"
      )}>
        <div className="lg:h-[150px]"></div>
        <div className="card-premium border border-border bg-card p-4 lg:p-5 rounded-xl lg:rounded-2xl" style={{ height: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gold" />
              <h3 className="font-display text-base lg:text-lg font-bold text-foreground">
                Unscheduled
              </h3>
            </div>
            <button
              onClick={() => setShowSidebar(false)}
              className="lg:hidden p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="font-mono-dm text-xs mb-4 text-muted-foreground">
            {unscheduledArticles.length} article{unscheduledArticles.length !== 1 ? 's' : ''} ready to schedule
          </p>
          
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3 rounded-xl border border-border bg-muted/30">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(100vh - 420px)' }}>
              {unscheduledArticles.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All articles scheduled!</p>
                </div>
              ) : (
                unscheduledArticles.map((article) => (
                  <div
                    key={article.id}
                    className="p-3 rounded-xl border border-border bg-muted/30 cursor-pointer transition-all hover:border-gold/30 hover:bg-gold/5 group"
                    onClick={() => {
                      setSelectedDate(new Date());
                      setShowScheduleModal(true);
                    }}
                  >
                    <p className="text-sm font-semibold mb-1 line-clamp-2 text-foreground group-hover:text-gold transition-colors">
                      {article.keyword}
                    </p>
                    <span 
                      className={cn(
                        "font-mono-dm text-[10px] px-2 py-0.5 rounded border inline-block",
                        article.status === 'optimized' 
                          ? "bg-teal/10 text-teal border-teal/20" 
                          : "bg-gold/10 text-gold border-gold/20"
                      )}
                    >
                      {article.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedDate && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowScheduleModal(false)}
        >
          <div 
            className="card-premium border border-border bg-card rounded-xl lg:rounded-2xl p-4 lg:p-6 w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg lg:text-xl font-bold text-foreground">
                Schedule for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 scrollbar-hide">
              {unscheduledArticles.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No articles available to schedule</p>
                </div>
              ) : (
                unscheduledArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => scheduleArticle(article.id, selectedDate)}
                    className="w-full p-3 rounded-xl border border-border bg-muted/30 text-left transition-all hover:border-gold/30 hover:bg-gold/5"
                  >
                    <p className="text-sm font-semibold mb-1 text-foreground">
                      {article.keyword}
                    </p>
                    <span 
                      className={cn(
                        "font-mono-dm text-[10px] px-2 py-0.5 rounded border inline-block",
                        article.status === 'optimized' 
                          ? "bg-teal/10 text-teal border-teal/20" 
                          : "bg-gold/10 text-gold border-gold/20"
                      )}
                    >
                      {article.status}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
