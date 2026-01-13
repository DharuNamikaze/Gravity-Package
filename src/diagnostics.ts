/**
 * Layout diagnostics engine
 * Analyzes layout issues and generates diagnostic reports
 */

import { DiagnosticResult, LayoutIssue, ElementPosition, ComputedStyles } from './types.js';
import { BrowserConnection } from './browser-connection.js';

export class DiagnosticsEngine {
  constructor(private connection: BrowserConnection) {}

  /**
   * Diagnose layout issues for an element
   */
  async diagnose(selector: string): Promise<DiagnosticResult> {
    // Validate selector
    const validation = this.validateSelector(selector);
    if (!validation.valid) {
      throw new Error(`Invalid selector: ${validation.error}`);
    }

    // Get document root
    const doc = await this.connection.sendCommand('DOM.getDocument', { depth: -1 });
    const root = doc.root;

    // Query for element
    const queryResult = await this.connection.sendCommand('DOM.querySelector', {
      nodeId: root.nodeId,
      selector,
    });

    if (!queryResult.nodeId) {
      throw new Error(`Element not found: ${selector}`);
    }

    const nodeId = queryResult.nodeId;

    // Get box model
    const boxResult = await this.connection.sendCommand('DOM.getBoxModel', { nodeId });
    const model = boxResult.model;

    // Get viewport metrics
    const layoutMetrics = await this.connection.sendCommand('Page.getLayoutMetrics', {});
    const viewport = layoutMetrics.layoutViewport;

    // Get computed styles
    const styleResult = await this.connection.sendCommand('CSS.getComputedStyleForNode', { nodeId });
    const styleMap = new Map<string, string>(
      styleResult.computedStyle.map((prop: any) => [prop.name, prop.value])
    );

    // Extract bounds
    const bounds = this.extractBounds(model);

    // Run diagnostic checks
    const issues: LayoutIssue[] = [];
    issues.push(...this.checkVisibility(styleMap));
    issues.push(...this.checkOffscreen(bounds, viewport));
    issues.push(...this.checkModalIssues(styleMap, bounds, viewport));
    issues.push(...this.checkOverflow(styleMap));

    // Sort by severity
    const severityOrder = { high: 0, medium: 1, low: 2 };
    issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Build result
    const result: DiagnosticResult = {
      element: selector,
      timestamp: new Date().toISOString(),
      found: true,
      position: {
        left: bounds.left,
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height,
      },
      viewport: {
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      },
      computedStyles: {
        display: styleMap.get('display') ?? '',
        position: styleMap.get('position') ?? '',
        width: styleMap.get('width') ?? '',
        height: styleMap.get('height') ?? '',
        overflow: styleMap.get('overflow') ?? '',
        zIndex: styleMap.get('z-index') ?? '',
        visibility: styleMap.get('visibility') ?? '',
        opacity: styleMap.get('opacity') ?? '',
      },
      issues: issues.length > 0 ? issues : [
        {
          type: 'none',
          severity: 'low',
          message: 'No layout issues detected',
          suggestion: 'Element appears to be positioned correctly',
        },
      ],
      confidence: issues.length > 0 ? 0.95 : 0.85,
      summary: {
        totalIssues: issues.length,
        highSeverity: issues.filter(i => i.severity === 'high').length,
        mediumSeverity: issues.filter(i => i.severity === 'medium').length,
        lowSeverity: issues.filter(i => i.severity === 'low').length,
      },
    };

    return result;
  }

  /**
   * Validate CSS selector
   */
  private validateSelector(selector: string): { valid: boolean; error?: string } {
    if (!selector || typeof selector !== 'string') {
      return { valid: false, error: 'Selector must be a non-empty string' };
    }

    const trimmed = selector.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: 'Selector cannot be empty' };
    }

    if (/^[0-9]/.test(trimmed)) {
      return { valid: false, error: 'Selector cannot start with a number' };
    }

    const openBrackets = (trimmed.match(/\[/g) || []).length;
    const closeBrackets = (trimmed.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      return { valid: false, error: 'Unbalanced brackets' };
    }

    return { valid: true };
  }

  /**
   * Extract element bounds from box model
   */
  private extractBounds(boxModel: any) {
    const left = Math.min(boxModel.content[0], boxModel.content[6]);
    const top = Math.min(boxModel.content[1], boxModel.content[3]);
    const right = Math.max(boxModel.content[2], boxModel.content[4]);
    const bottom = Math.max(boxModel.content[5], boxModel.content[7]);

    return {
      left: Math.round(left),
      top: Math.round(top),
      right: Math.round(right),
      bottom: Math.round(bottom),
      width: Math.round(boxModel.width),
      height: Math.round(boxModel.height),
    };
  }

  /**
   * Check visibility issues
   */
  private checkVisibility(styleMap: Map<string, string>): LayoutIssue[] {
    const issues: LayoutIssue[] = [];

    const display = styleMap.get('display');
    if (display === 'none') {
      issues.push({
        type: 'hidden-display',
        severity: 'high',
        message: 'Element has display: none',
        suggestion: 'Change to display: block/flex/grid to make visible',
      });
    }

    const visibility = styleMap.get('visibility');
    if (visibility === 'hidden') {
      issues.push({
        type: 'hidden-visibility',
        severity: 'high',
        message: 'Element has visibility: hidden',
        suggestion: 'Change to visibility: visible',
      });
    }

    const opacity = styleMap.get('opacity');
    if (opacity !== undefined) {
      const opacityValue = parseFloat(opacity);
      if (opacityValue === 0) {
        issues.push({
          type: 'hidden-opacity',
          severity: 'high',
          message: 'Element has opacity: 0',
          suggestion: 'Change to opacity: 1',
        });
      } else if (opacityValue < 0.1) {
        issues.push({
          type: 'low-opacity',
          severity: 'medium',
          message: `Element has very low opacity: ${opacity}`,
          suggestion: 'Increase opacity for better visibility',
        });
      }
    }

    return issues;
  }

  /**
   * Check offscreen issues
   */
  private checkOffscreen(bounds: any, viewport: any): LayoutIssue[] {
    const issues: LayoutIssue[] = [];
    const THRESHOLD = 2;

    if (bounds.right > viewport.clientWidth + THRESHOLD) {
      const overflow = bounds.right - viewport.clientWidth;
      issues.push({
        type: 'offscreen-right',
        severity: 'high',
        message: `Element extends ${overflow}px beyond right edge`,
        suggestion: 'Add max-width: 100% or use overflow: hidden on parent',
        pixels: overflow,
      });
    }

    if (bounds.bottom > viewport.clientHeight + THRESHOLD) {
      const overflow = bounds.bottom - viewport.clientHeight;
      issues.push({
        type: 'offscreen-bottom',
        severity: 'medium',
        message: `Element extends ${overflow}px beyond bottom edge`,
        suggestion: 'Add max-height: 100vh or enable scrolling',
        pixels: overflow,
      });
    }

    if (bounds.left < -THRESHOLD) {
      const overflow = Math.abs(bounds.left);
      issues.push({
        type: 'offscreen-left',
        severity: 'high',
        message: `Element starts ${overflow}px to the left`,
        suggestion: 'Check left/margin-left values',
        pixels: overflow,
      });
    }

    if (bounds.top < -THRESHOLD) {
      const overflow = Math.abs(bounds.top);
      issues.push({
        type: 'offscreen-top',
        severity: 'high',
        message: `Element starts ${overflow}px above viewport`,
        suggestion: 'Check top/margin-top values',
        pixels: overflow,
      });
    }

    return issues;
  }

  /**
   * Check modal/positioning issues
   */
  private checkModalIssues(styleMap: Map<string, string>, bounds: any, viewport: any): LayoutIssue[] {
    const issues: LayoutIssue[] = [];

    const position = styleMap.get('position');
    const zIndex = styleMap.get('z-index');

    if (position === 'fixed' || position === 'absolute') {
      if (zIndex === 'auto' || !zIndex) {
        issues.push({
          type: 'modal-no-zindex',
          severity: 'medium',
          message: `Positioned element (${position}) has no z-index`,
          suggestion: 'Add z-index: 1000 or higher for modals',
        });
      }
    }

    return issues;
  }

  /**
   * Check overflow issues
   */
  private checkOverflow(styleMap: Map<string, string>): LayoutIssue[] {
    const issues: LayoutIssue[] = [];

    const overflow = styleMap.get('overflow');
    if (overflow === 'hidden') {
      issues.push({
        type: 'overflow-hidden',
        severity: 'low',
        message: 'Element has overflow: hidden',
        suggestion: 'Content may be clipped; change to overflow: auto if needed',
      });
    }

    return issues;
  }
}
