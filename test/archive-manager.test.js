import test from 'node:test';
import assert from 'node:assert/strict';

import { ArchiveManager } from '../src/utils/archiveManager.js';

const STORAGE_KEY = 'ziwei_archives_v1';

class MemoryStorage {
  constructor(initialValue = null) {
    this.value = initialValue;
    this.failWrites = false;
  }

  getItem(key) {
    return key === STORAGE_KEY ? this.value : null;
  }

  setItem(key, value) {
    if (this.failWrites) throw new Error('quota exceeded');
    if (key === STORAGE_KEY) this.value = value;
  }
}

const createManager = (initialRecords = []) => {
  const storage = new MemoryStorage(JSON.stringify(initialRecords));
  const events = [];
  const manager = new ArchiveManager(storage, {
    dispatchEvent(event) {
      events.push(event.type);
    },
  });
  return { manager, storage, events };
};

test('损坏的档案根节点与无效记录不会使档案库崩溃', () => {
  const objectStorage = new MemoryStorage(JSON.stringify({ records: [] }));
  const mixedStorage = new MemoryStorage(JSON.stringify([
    null,
    { id: {}, name: '坏记录' },
    { id: 'valid', name: '有效记录', type: 'ziwei' },
  ]));

  assert.deepEqual(new ArchiveManager(objectStorage).getRecords(), []);
  assert.deepEqual(new ArchiveManager(mixedStorage).getRecords().map(({ id }) => id), ['valid']);
});

test('新增档案仅在成功落盘后更新内存且系统字段不可覆盖', () => {
  const { manager, storage, events } = createManager();
  const saved = manager.addRecord({ id: 'caller-id', name: '杨先生', type: 'ziwei' });

  assert.notEqual(saved.id, 'caller-id');
  assert.equal(manager.getRecords().length, 1);
  assert.deepEqual(events, ['archive-updated']);

  storage.failWrites = true;
  const originalConsoleError = console.error;
  console.error = () => {};
  let failed;
  try {
    failed = manager.addRecord({ name: '写入失败', type: 'ziwei' });
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(failed, null);
  assert.equal(manager.getRecords().length, 1);
});

test('合并导入保留本机同ID档案并只添加新档案', () => {
  const local = { id: 'same', name: '本机新版', type: 'ziwei', updatedAt: 200 };
  const { manager } = createManager([local]);
  const result = manager.importData(JSON.stringify([
    { id: 'same', name: '备份旧版', type: 'ziwei', updatedAt: 100 },
    { id: 'new', name: '新增档案', type: 'ziwei', updatedAt: 300 },
    { id: {}, name: '无效档案' },
  ]));

  assert.equal(result.success, true);
  assert.equal(result.count, 2);
  assert.equal(manager.getRecords().find(({ id }) => id === 'same').name, '本机新版');
  assert.equal(manager.getRecords().find(({ id }) => id === 'new').name, '新增档案');
});
