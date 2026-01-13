/**
 * Core type definitions for Gravity
 */

export interface DiagnosticResult {
  element: string;
  timestamp: string;
  found: boolean;
  position: ElementPosition;
  viewport: ViewportInfo;
  computedStyles: ComputedStyles;
  issues: LayoutIssue[];
  confidence: number;
  summary: IssueSummary;
}

export interface ElementPosition {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface ViewportInfo {
  width: number;
  height: number;
}

export interface ComputedStyles {
  display: string;
  position: string;
  width: string;
  height: string;
  overflow: string;
  zIndex: string;
  visibility: string;
  opacity: string;
  [key: string]: string;
}

export interface LayoutIssue {
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  suggestion: string;
  pixels?: number;
}

export interface IssueSummary {
  totalIssues: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
}

export interface ElementInfo {
  selector: string;
  tagName: string;
  classes: string[];
  id?: string;
  position: ElementPosition;
  styles: ComputedStyles;
}

export interface ConnectionStatus {
  connected: boolean;
  message: string;
  timestamp: string;
}

export interface BridgeOptions {
  port?: number;
  timeout?: number;
  autoReconnect?: boolean;
}
