import { createClient } from "../../supabase/server";

export type AuthEvent = {
  type: 'sign_up' | 'sign_in' | 'sign_out' | 'password_reset' | 'password_update';
  userId?: string;
  email?: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
};

export type AuthStats = {
  totalEvents: number;
  successRate: number;
  eventsByType: Record<string, number>;
  recentErrors: Array<{
    type: string;
    error: string;
    timestamp: string;
  }>;
  rateLimitHits: number;
};

export async function trackAuthEvent(event: AuthEvent) {
  try {
    const supabase = await createClient();
    
    await supabase
      .from('auth_events')
      .insert({
        event_type: event.type,
        user_id: event.userId,
        email: event.email,
        success: event.success,
        error: event.error,
        metadata: event.metadata,
        created_at: new Date().toISOString()
      });
  } catch (err) {
    // Don't throw errors from analytics
    console.error('Failed to track auth event:', err);
  }
}

export async function getAuthStats(timeWindow: number = 24 * 60 * 60): Promise<AuthStats> {
  try {
    const supabase = await createClient();
    const cutoff = new Date(Date.now() - timeWindow * 1000);
    
    const { data: events, error } = await supabase
      .from('auth_events')
      .select('*')
      .gte('created_at', cutoff.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalEvents = events.length;
    const successfulEvents = events.filter(e => e.success).length;
    const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0;

    // Count events by type
    const eventsByType = events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get recent errors
    const recentErrors = events
      .filter(e => !e.success)
      .slice(0, 10)
      .map(e => ({
        type: e.event_type,
        error: e.error || 'Unknown error',
        timestamp: e.created_at
      }));

    // Count rate limit hits
    const rateLimitHits = events.filter(e => 
      e.error?.includes('Rate limit exceeded')
    ).length;

    return {
      totalEvents,
      successRate,
      eventsByType,
      recentErrors,
      rateLimitHits
    };
  } catch (err) {
    console.error('Failed to get auth stats:', err);
    return {
      totalEvents: 0,
      successRate: 0,
      eventsByType: {},
      recentErrors: [],
      rateLimitHits: 0
    };
  }
}

export async function cleanupAuthEvents(timeWindow: number = 30 * 24 * 60 * 60) {
  try {
    const supabase = await createClient();
    const cutoff = new Date(Date.now() - timeWindow * 1000);

    const { error } = await supabase
      .from('auth_events')
      .delete()
      .lt('created_at', cutoff.toISOString());

    if (error) {
      console.error('Failed to cleanup auth events:', error);
    }
  } catch (err) {
    console.error('Unexpected error during auth events cleanup:', err);
  }
} 