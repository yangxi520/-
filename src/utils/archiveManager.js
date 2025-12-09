import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'ziwei_archives_v1';

/**
 * @typedef {Object} ChartRecord
 * @property {string} id
 * @property {string} name
 * @property {string} gender 'male' | 'female'
 * @property {string} type 'money' | 'ziwei' (expandable)
 * @property {Object} data The actual chart data (e.g., hexagram result, birth time)
 * @property {string} group 'family' | 'friend' | 'customer' | 'other'
 * @property {string} note
 * @property {number} createdAt
 * @property {number} updatedAt
 */

class ArchiveManager {
    constructor() {
        this.records = this._loadFromStorage();
    }

    _loadFromStorage() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load archives:', e);
            return [];
        }
    }

    _saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
            // Dispatch event for reactive UI updates if needed across tabs/components
            window.dispatchEvent(new Event('archive-updated'));
        } catch (e) {
            console.error('Failed to save archives:', e);
            alert('存储空间不足或保存失败！');
        }
    }

    /**
     * Get all records, optionally filtered
     */
    getRecords(filterFn = null) {
        if (!filterFn) return [...this.records];
        return this.records.filter(filterFn);
    }

    /**
     * Save a new record
     * @param {Omit<ChartRecord, 'id' | 'createdAt' | 'updatedAt'>} recordInput 
     */
    addRecord(recordInput) {
        const newRecord = {
            id: uuidv4(),
            ...recordInput,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        // Add to beginning of list
        this.records.unshift(newRecord);
        this._saveToStorage();
        return newRecord;
    }

    /**
     * Update an existing record
     */
    updateRecord(id, updates) {
        const index = this.records.findIndex(r => r.id === id);
        if (index === -1) return null;

        this.records[index] = {
            ...this.records[index],
            ...updates,
            updatedAt: Date.now()
        };
        this._saveToStorage();
        return this.records[index];
    }

    /**
     * Delete a record
     */
    deleteRecord(id) {
        this.records = this.records.filter(r => r.id !== id);
        this._saveToStorage();
    }

    /**
     * Export all data as JSON blob
     */
    exportData() {
        const dataStr = JSON.stringify(this.records, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `ziwei_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Import data from JSON file content
     * @param {string} jsonString 
     * @param {boolean} merge If true, keeps existing and adds new (deduping by ID). If false, overwrites.
     */
    importData(jsonString, merge = true) {
        try {
            const imported = JSON.parse(jsonString);
            if (!Array.isArray(imported)) throw new Error('Invalid format');

            if (merge) {
                // Merge logic: standard is replace if ID exists, add if new
                const currentMap = new Map(this.records.map(r => [r.id, r]));
                imported.forEach(rec => {
                    if (rec.id && rec.name) { // Basic validation
                        currentMap.set(rec.id, rec);
                    }
                });
                this.records = Array.from(currentMap.values())
                    .sort((a, b) => b.updatedAt - a.updatedAt);
            } else {
                this.records = imported;
            }

            this._saveToStorage();
            return { success: true, count: this.records.length };
        } catch (e) {
            console.error('Import failed:', e);
            return { success: false, error: e.message };
        }
    }
}

// Singleton instance
export const archiveManager = new ArchiveManager();
