// Mock data for CartCoroner AI Dashboard
// Realistic Indian ecommerce behavioral intelligence data

export type RootCause = 
  | 'PRICE_SHOCK' 
  | 'SHIPPING_SURPRISE' 
  | 'TRUST_GAP' 
  | 'VARIANT_CONFUSION' 
  | 'JUST_BROWSING';

export interface SessionStep {
  action: string;
  timestamp: string;
  duration?: string;
  highlight?: boolean;
}

export interface Diagnosis {
  id: string;
  customerEmail: string;
  cartValue: number;
  abandonmentStep: string;
  rootCause: RootCause;
  confidence: number;
  behavioralEvidence: string[];
  aiRecommendation: string;
  weeklyRecoveryImpact: number;
  sessionTimeline: SessionStep[];
  productCategory: string;
  timestamp: string;
}

export interface MetricCard {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  subtitle?: string;
}

export interface AIInsight {
  id: string;
  insight: string;
  confidence: number;
  category: string;
  impact: 'high' | 'medium' | 'low';
}

export const rootCauseConfig: Record<RootCause, { label: string; color: string; bgColor: string; glowColor: string }> = {
  PRICE_SHOCK: { 
    label: 'Price Shock', 
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    glowColor: 'shadow-red-500/30'
  },
  SHIPPING_SURPRISE: { 
    label: 'Shipping Surprise', 
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    glowColor: 'shadow-orange-500/30'
  },
  TRUST_GAP: { 
    label: 'Trust Gap', 
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    glowColor: 'shadow-yellow-500/30'
  },
  VARIANT_CONFUSION: { 
    label: 'Variant Confusion', 
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    glowColor: 'shadow-blue-500/30'
  },
  JUST_BROWSING: { 
    label: 'Just Browsing', 
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    glowColor: 'shadow-gray-500/30'
  },
};

export const mockDiagnoses: Diagnosis[] = [
  {
    id: '1',
    customerEmail: 'karan.sharma***@gmail.com',
    cartValue: 3499,
    abandonmentStep: 'Shipping Method',
    rootCause: 'SHIPPING_SURPRISE',
    confidence: 96,
    behavioralEvidence: [
      'Hovered free shipping banner (₹3500 threshold)',
      'Checked delivery timeline for express vs standard',
      'Revisited cart pricing breakdown',
      'Abandoned session 6 seconds after shipping fees were added'
    ],
    aiRecommendation: 'Lower free-shipping threshold from ₹3500 to ₹3000 for high-margin electronics carts to capture near-misses.',
    weeklyRecoveryImpact: 145000,
    sessionTimeline: [
      { action: 'Viewed Sony Wireless Headphones', timestamp: '14:21:05' },
      { action: 'Added to Cart', timestamp: '14:23:18' },
      { action: 'Hovered Free Shipping Banner', timestamp: '14:24:34', highlight: true },
      { action: 'Checked Delivery Date', timestamp: '14:25:02' },
      { action: 'Revisited Cart Total', timestamp: '14:26:01', highlight: true },
      { action: 'Abandoned at Shipping', timestamp: '14:26:09', highlight: true }
    ],
    productCategory: 'Electronics',
    timestamp: 'Just now'
  },
  {
    id: '2',
    customerEmail: 'priya.venkat***@outlook.com',
    cartValue: 18500,
    abandonmentStep: 'Payment Selection',
    rootCause: 'TRUST_GAP',
    confidence: 92,
    behavioralEvidence: [
      'Viewed return policy and paused for 45 seconds',
      'Checked seller reviews page',
      'Viewed authenticity and material details repeatedly',
      'Hesitated at payment gateway (2m 10s idle time)'
    ],
    aiRecommendation: 'Display trust badges, verified-purchase reviews, and secure checkout guarantees directly on the payment gateway page.',
    weeklyRecoveryImpact: 285000,
    sessionTimeline: [
      { action: 'Viewed Kanjivaram Silk Saree', timestamp: '11:41:12' },
      { action: 'Checked Authenticity Certificate', timestamp: '11:45:30' },
      { action: 'Viewed Return Policy', timestamp: '11:48:45', highlight: true },
      { action: 'Checked Seller Reviews', timestamp: '11:52:18', highlight: true },
      { action: 'Added to Cart', timestamp: '11:54:02' },
      { action: 'Hesitated at Payment', timestamp: '11:58:25', highlight: true }
    ],
    productCategory: 'Ethnic Wear',
    timestamp: '12 mins ago'
  },
  {
    id: '3',
    customerEmail: 'rahul.desai***@gmail.com',
    cartValue: 2199,
    abandonmentStep: 'Product Page',
    rootCause: 'VARIANT_CONFUSION',
    confidence: 88,
    behavioralEvidence: [
      'Toggled size between 40 and 42 multiple times',
      'Opened size guide twice',
      'Switched between Navy and Charcoal color variants',
      'Revisited product gallery images to check fit'
    ],
    aiRecommendation: 'Add AI-powered size recommendation and prominent verified fit reviews ("Runs small - order one size up").',
    weeklyRecoveryImpact: 84000,
    sessionTimeline: [
      { action: 'Viewed Men\'s Slim Fit Blazer', timestamp: '16:12:45' },
      { action: 'Selected Size 40', timestamp: '16:13:20' },
      { action: 'Opened Size Guide', timestamp: '16:15:33', highlight: true },
      { action: 'Changed to Size 42', timestamp: '16:17:02', highlight: true },
      { action: 'Switched to Charcoal Variant', timestamp: '16:17:45' },
      { action: 'Abandoned Session', timestamp: '16:18:45', highlight: true }
    ],
    productCategory: 'Apparel',
    timestamp: '45 mins ago'
  },
  {
    id: '4',
    customerEmail: 'neha.kapoor***@yahoo.com',
    cartValue: 85000,
    abandonmentStep: 'Payment Selection',
    rootCause: 'PRICE_SHOCK',
    confidence: 95,
    behavioralEvidence: [
      'Explored No-Cost EMI options multiple times',
      'Changed payment method twice',
      'Revisited pricing and tax breakdown',
      'Paused at payment gateway for 3m 40s before closing tab'
    ],
    aiRecommendation: 'Highlight No-Cost EMI prominently above the fold and remove convenience fees on high-value carts over ₹50K.',
    weeklyRecoveryImpact: 650000,
    sessionTimeline: [
      { action: 'Viewed MacBook Air M2', timestamp: '20:05:18' },
      { action: 'Compared Storage Models', timestamp: '20:12:45' },
      { action: 'Added to Cart', timestamp: '20:18:30' },
      { action: 'Checked EMI Options', timestamp: '20:19:55', highlight: true },
      { action: 'Viewed Payment Methods', timestamp: '20:22:10', highlight: true },
      { action: 'Abandoned at Payment', timestamp: '20:24:38', highlight: true }
    ],
    productCategory: 'Electronics',
    timestamp: '1 hour ago'
  },
  {
    id: '5',
    customerEmail: 'vikram.singh***@hotmail.com',
    cartValue: 499,
    abandonmentStep: 'Product Page',
    rootCause: 'JUST_BROWSING',
    confidence: 82,
    behavioralEvidence: [
      'Short session duration (< 45 seconds)',
      'Weak page engagement and scroll depth',
      'Low-value cart configuration',
      'No clear friction interactions before drop-off'
    ],
    aiRecommendation: 'No immediate intervention required. Retarget via low-cost Facebook dynamic product ads after 48 hours.',
    weeklyRecoveryImpact: 12000,
    sessionTimeline: [
      { action: 'Landed from Instagram Ad', timestamp: '09:34:12' },
      { action: 'Viewed Vitamin C Face Serum', timestamp: '09:34:18' },
      { action: 'Quick Scroll to Reviews', timestamp: '09:34:35' },
      { action: 'Exited Session', timestamp: '09:34:48', highlight: true }
    ],
    productCategory: 'Beauty',
    timestamp: '2 hours ago'
  }
];

export const mockMetrics: MetricCard[] = [
  {
    title: 'Total Abandoned Revenue',
    value: '₹42.6L',
    change: 14.2,
    trend: 'up',
    subtitle: 'Last 30 days'
  },
  {
    title: 'Recoverable Opportunity',
    value: '₹14.8L',
    change: 11.5,
    trend: 'up',
    subtitle: '35% of abandoned'
  },
  {
    title: 'Top Root Cause',
    value: 'Shipping Surprise',
    change: 18,
    trend: 'up',
    subtitle: '38% of all abandonments'
  },
  {
    title: 'Active Diagnoses',
    value: '2,412',
    change: 4.8,
    trend: 'up',
    subtitle: 'AI analyzing in real-time'
  }
];

export const mockInsights: AIInsight[] = [
  {
    id: '1',
    insight: 'Electronics carts with delivery estimates over 5 days abandon 2.4x more frequently.',
    confidence: 96,
    category: 'Shipping',
    impact: 'high'
  },
  {
    id: '2',
    insight: 'Variant confusion increases 41% when size guides are hidden below the fold on mobile.',
    confidence: 92,
    category: 'UX',
    impact: 'high'
  },
  {
    id: '3',
    insight: 'Premium ethnic wear (>₹15K) shows 3.2x more trust-verification behavior (reviews, returns) before checkout.',
    confidence: 89,
    category: 'Trust',
    impact: 'high'
  },
  {
    id: '4',
    insight: 'Carts within ₹500 of the free shipping threshold account for 28% of all shipping-related drop-offs.',
    confidence: 94,
    category: 'Shipping',
    impact: 'medium'
  },
  {
    id: '5',
    insight: 'High-value tech carts (>₹50K) without visible No-Cost EMI options have a 65% higher abandonment rate.',
    confidence: 91,
    category: 'Payment',
    impact: 'high'
  },
  {
    id: '6',
    insight: 'Sessions originating from Instagram Ads are 3x more likely to be Just Browsing drops (< 60s session length).',
    confidence: 84,
    category: 'Traffic',
    impact: 'low'
  }
];

export const rootCauseDistribution = [
  { name: 'Shipping Surprise', value: 38, fill: 'var(--chart-2)' },
  { name: 'Price Shock', value: 25, fill: 'var(--chart-1)' },
  { name: 'Trust Gap', value: 20, fill: 'var(--chart-3)' },
  { name: 'Variant Confusion', value: 12, fill: 'var(--chart-4)' },
  { name: 'Just Browsing', value: 5, fill: 'var(--chart-5)' }
];

export const abandonmentTrend = [
  { date: 'Mon', abandoned: 210, recovered: 65 },
  { date: 'Tue', abandoned: 245, recovered: 82 },
  { date: 'Wed', abandoned: 189, recovered: 55 },
  { date: 'Thu', abandoned: 278, recovered: 94 },
  { date: 'Fri', abandoned: 312, recovered: 110 },
  { date: 'Sat', abandoned: 415, recovered: 145 },
  { date: 'Sun', abandoned: 380, recovered: 125 }
];

export const revenueImpact = [
  { category: 'Electronics', lost: 1450000, recoverable: 580000 },
  { category: 'Ethnic Wear', lost: 980000, recoverable: 420000 },
  { category: 'Apparel', lost: 750000, recoverable: 280000 },
  { category: 'Home Decor', lost: 450000, recoverable: 150000 },
  { category: 'Beauty', lost: 280000, recoverable: 95000 }
];
