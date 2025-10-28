import { API_BASE_URL, API_BASE_PATH } from '../config';
import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import './Settings.css';

const Settings = () => {
  const toast = useToast();
  const [settings, setSettings] = useState({
    restaurant_name: 'My Restaurant',
    address: '123 Main Street, City, State',
    mobile: '+1 234 567 8900',
    email: 'info@myrestaurant.com',
    tax_rate: '8.5',
    print_kot: true,
    print_invoice: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const API_BASE = `${API_BASE_URL}/settings`;

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/read.php`);
      const result = await response.json();

      if (result.success) {
        setSettings({
          restaurant_name: result.data.restaurant_name || 'My Restaurant',
          address: result.data.address || '123 Main Street, City, State',
          mobile: result.data.mobile || '+1 234 567 8900',
          email: result.data.email || 'info@myrestaurant.com',
          tax_rate: result.data.tax_rate || '8.5',
          print_kot: result.data.print_kot === '1' || result.data.print_kot === true,
          print_invoice: result.data.print_invoice === '1' || result.data.print_invoice === true
        });
      } else {
        toast.error('Failed to load settings: ' + result.message);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Error loading settings. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/update.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Settings saved successfully!');
      } else {
        toast.error('Failed to save settings: ' + result.message);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleBackup = async (type) => {
    try {
      const response = await fetch(`${API_BASE}/backup.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type,
          tables: ['all']
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (type === 'csv') {
          // Convert JSON data to CSV format for each table
          let csvContent = '';
          Object.keys(result.data).forEach(tableName => {
            csvContent += `\n\n=== ${tableName.toUpperCase()} ===\n`;
            const tableData = result.data[tableName];
            tableData.forEach((row, index) => {
              csvContent += row.join(',') + '\n';
            });
          });
          downloadFile(csvContent, result.filename.replace('.json', '.csv'), 'text/csv');
        } else {
          downloadFile(result.data, result.filename, 'application/sql');
        }
        toast.success(`${type.toUpperCase()} backup downloaded successfully!`);
      } else {
        toast.error('Failed to generate backup: ' + result.message);
      }
    } catch (error) {
      console.error('Error generating backup:', error);
      toast.error('Error generating backup. Please try again.');
    }
  };

  const handleEmailBackup = () => {
    toast.info('Email backup functionality will be implemented soon!');
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#a0aec0' }}>
          <h3>Loading Settings...</h3>
          <p>Please wait while we load your settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {(loading || saving) && <Spinner overlay={true} />}
      <h1>Settings</h1>

      <div className="settings-sections">
        <div className="settings-section">
          <h2>Restaurant Information</h2>
          <div className="form-group">
            <label>Restaurant Name</label>
            <input
              type="text"
              value={settings.restaurant_name}
              onChange={(e) => handleInputChange('restaurant_name', e.target.value)}
              placeholder="Enter restaurant name"
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea
              value={settings.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={3}
              placeholder="Enter restaurant address"
            />
          </div>
          <div className="form-group">
            <label>Mobile Number</label>
            <input
              type="tel"
              value={settings.mobile}
              onChange={(e) => handleInputChange('mobile', e.target.value)}
              placeholder="Enter mobile number"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
            />
          </div>
        </div>

        <div className="settings-section">
          <h2>Business Settings</h2>
          <div className="form-group">
            <label>Tax Rate (%)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={settings.tax_rate}
              onChange={(e) => handleInputChange('tax_rate', e.target.value)}
              placeholder="Enter tax rate"
            />
          </div>
        </div>


        <div className="settings-section">
          <h2>Print Settings</h2>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.print_kot}
                onChange={(e) => handleInputChange('print_kot', e.target.checked)}
              />
              Auto-print Kitchen Order Ticket (KOT)
            </label>
          </div>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.print_invoice}
                onChange={(e) => handleInputChange('print_invoice', e.target.checked)}
              />
              Auto-print Customer Invoice
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>Data Backup & Export</h2>
          <p style={{ color: '#a0aec0', marginBottom: '20px' }}>
            Create backups of your restaurant data for safekeeping or migration purposes.
          </p>

          <div className="backup-actions">
            <button
              onClick={() => handleBackup('csv')}
              className="btn btn-secondary backup-btn"
              style={{ marginRight: '10px' }}
            >
              <span className="material-icons">file_download</span>
              Export as CSV
            </button>
            <button
              onClick={() => handleBackup('sql')}
              className="btn btn-secondary backup-btn"
              style={{ marginRight: '10px' }}
            >
              <span className="material-icons">storage</span>
              Export as SQL
            </button>
            <button
              onClick={handleEmailBackup}
              className="btn btn-warning backup-btn"
              disabled
              title="Coming Soon"
            >
              <span className="material-icons">email</span>
              Email Backup
            </button>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button
          onClick={handleSave}
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="material-icons">refresh</span>
              Saving...
            </>
          ) : (
            <>
              <span className="material-icons">save</span>
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;