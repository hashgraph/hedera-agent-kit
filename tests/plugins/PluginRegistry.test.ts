import { describe, expect, test, vi, beforeEach } from 'vitest';
import { PluginRegistry } from '../../src/plugins/PluginRegistry';
import { BasePlugin } from '../../src/plugins/BasePlugin';
import { StructuredTool } from '@langchain/core/tools';
import { Logger } from '../../src/utils/logger';
import { HederaTool, PluginContext } from '../../src';
import { z } from 'zod';

const MOCK_PLUGIN_ID = 'mock-plugin-id';

/**
 * Mock tool for testing
 */
class MockTool extends StructuredTool {
  name = 'mock_tool';
  description = 'A mock tool for testing';
  schema = z.object({});

  async _call(): Promise<string> {
    return 'Mock tool result';
  }
}

/**
 * Mock plugin for testing
 */
class MockPlugin extends BasePlugin {
  id = MOCK_PLUGIN_ID;
  name = 'Mock Plugin';
  description = 'A mock plugin for testing';
  version = '1.0.0';
  author = 'Test Author';

  override async initialize(context: PluginContext): Promise<void> {
    await super.initialize(context);
  }

  getTools(): HederaTool[] {
    return [new MockTool() as unknown as HederaTool];
  }

  cleanup = vi.fn(async () => {});
}

describe('PluginRegistry', () => {
  let registry: PluginRegistry;
  let mockPlugin: MockPlugin;
  let mockContext: PluginContext;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as unknown as Logger;

    mockContext = {
      logger: mockLogger,
      config: {},
    };

    registry = new PluginRegistry(mockContext);
    mockPlugin = new MockPlugin();
  });

  test('should register a plugin', async () => {
    await registry.registerPlugin(mockPlugin);

    expect(mockPlugin.initialize).toHaveBeenCalledWith(mockContext);
    expect(registry.getPlugin(MOCK_PLUGIN_ID)).toBe(mockPlugin);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Plugin registered')
    );
  });

  test('should throw when registering a duplicate plugin', async () => {
    await registry.registerPlugin(mockPlugin);

    await expect(async () => {
      await registry.registerPlugin(mockPlugin);
    }).rejects.toThrow('already registered');
  });

  test('should get all plugins', async () => {
    await registry.registerPlugin(mockPlugin);

    const plugins = registry.getAllPlugins();
    expect(plugins).toHaveLength(1);
    expect(plugins[0]).toBe(mockPlugin);
  });

  test('should get all tools from all plugins', async () => {
    await registry.registerPlugin(mockPlugin);

    const tools = registry.getAllTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('mock_tool');
    expect(mockPlugin.getTools).toHaveBeenCalled();
  });

  test('should unregister a plugin', async () => {
    await registry.registerPlugin(mockPlugin);

    const result = await registry.unregisterPlugin(MOCK_PLUGIN_ID);
    expect(result).toBe(true);
    expect(mockPlugin.cleanup).toHaveBeenCalled();
    expect(registry.getPlugin(MOCK_PLUGIN_ID)).toBeUndefined();
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Plugin unregistered')
    );
  });

  test('should return false when unregistering a non-existent plugin', async () => {
    const result = await registry.unregisterPlugin('non-existent');
    expect(result).toBe(false);
  });

  test('should handle cleanup errors gracefully', async () => {
    await registry.registerPlugin(mockPlugin);

    mockPlugin.cleanup.mockImplementation(() => {
      throw new Error('Cleanup error');
    });

    const result = await registry.unregisterPlugin(MOCK_PLUGIN_ID);
    expect(result).toBe(true);
    expect(mockPlugin.cleanup).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error during plugin cleanup')
    );
  });

  test('should unregister all plugins', async () => {
    const mockPlugin2 = new MockPlugin();
    mockPlugin2.id = 'mock-plugin-2';

    await registry.registerPlugin(mockPlugin);
    await registry.registerPlugin(mockPlugin2);

    await registry.unregisterAllPlugins();

    expect(registry.getAllPlugins()).toHaveLength(0);
    expect(mockPlugin.cleanup).toHaveBeenCalled();
    expect(mockPlugin2.cleanup).toHaveBeenCalled();
  });
});
