# 🎄 PÜHADE HALDUSSÜSTEEM - FRONTEND KOMPONENDID

---

## 🎨 KOMPONENDID

### 1. Holidays Table (Põhitabel)

**Fail:** `apps/web/src/components/holidays/HolidaysTable.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Tooltip,
  message,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  CloudDownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

interface Holiday {
  id: string;
  date: string;
  name: string;
  local_name: string;
  country_code: string;
  country_name: string;
  type_name: string;
  type_color: string;
  is_paid: boolean;
  pay_multiplier: number;
  is_work_day: boolean;
  requires_approval: boolean;
  is_nationwide: boolean;
  source: string;
  day_of_week: number;
  day_name: string;
  month_name: string;
}

interface HolidaysTableProps {
  onAdd: () => void;
  onEdit: (holiday: Holiday) => void;
  onDelete: (id: string) => void;
  onImport: () => void;
}

export function HolidaysTable({
  onAdd,
  onEdit,
  onDelete,
  onImport,
}: HolidaysTableProps) {
  const [data, setData] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    countryCode: 'EE',
    search: '',
  });

  useEffect(() => {
    loadData();
  }, [filters.year, filters.countryCode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year: filters.year.toString(),
        countryCode: filters.countryCode,
      });
      
      const response = await fetch(`/api/holidays?${params}`);
      const result = await response.json();
      
      setData(result);
    } catch (error) {
      message.error('Pühade laadimine ebaõnnestus');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Kas oled kindel, et soovid kustutada "${name}"?`)) return;
    
    try {
      const response = await fetch(`/api/holidays/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      message.success('Püha kustutatud');
      loadData();
    } catch (error) {
      message.error('Kustutamine ebaõnnestus');
    }
  };

  // Filter data by search
  const filteredData = data.filter((holiday) => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      holiday.name.toLowerCase().includes(searchLower) ||
      holiday.local_name?.toLowerCase().includes(searchLower)
    );
  });

  const columns: ColumnsType<Holiday> = [
    {
      title: 'Kuupäev',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      fixed: 'left',
      sorter: (a, b) => a.date.localeCompare(b.date),
      render: (date: string, record) => (
        <div>
          <div className="font-medium">
            {dayjs(date).format('DD.MM.YYYY')}
          </div>
          <div className="text-xs text-gray-500">
            {record.day_name}
          </div>
        </div>
      ),
    },
    {
      title: 'Nimetus',
      key: 'name',
      width: 250,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.name}</div>
          {record.local_name && record.local_name !== record.name && (
            <div className="text-xs text-gray-600">{record.local_name}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Riik',
      dataIndex: 'country_code',
      key: 'country',
      width: 100,
      filters: [
        { text: 'Eesti', value: 'EE' },
        { text: 'Rootsi', value: 'SE' },
        { text: 'Soome', value: 'FI' },
        { text: 'Läti', value: 'LV' },
        { text: 'Leedu', value: 'LT' },
      ],
      onFilter: (value, record) => record.country_code === value,
      render: (code: string) => (
        <Tag className="text-xs">{code}</Tag>
      ),
    },
    {
      title: 'Tüüp',
      dataIndex: 'type_name',
      key: 'type',
      width: 120,
      render: (type: string, record) => (
        <Tag color={record.type_color} className="text-xs">
          {type}
        </Tag>
      ),
    },
    {
      title: 'Töötasu',
      key: 'pay',
      width: 120,
      sorter: (a, b) => a.pay_multiplier - b.pay_multiplier,
      render: (_, record) => (
        <div className="text-center">
          {record.is_paid ? (
            <div>
              <Badge status="success" />
              <span className="font-medium">
                {record.pay_multiplier}x
              </span>
            </div>
          ) : (
            <div>
              <Badge status="default" />
              <span className="text-gray-500">Tasustamata</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Tööpäev',
      dataIndex: 'is_work_day',
      key: 'work_day',
      width: 100,
      align: 'center',
      filters: [
        { text: 'Jah', value: true },
        { text: 'Ei', value: false },
      ],
      onFilter: (value, record) => record.is_work_day === value,
      render: (isWorkDay: boolean) => (
        <Tag color={isWorkDay ? 'blue' : 'red'} className="text-xs">
          {isWorkDay ? 'Jah' : 'Ei'}
        </Tag>
      ),
    },
    {
      title: 'Heakskiit',
      dataIndex: 'requires_approval',
      key: 'approval',
      width: 110,
      align: 'center',
      render: (requires: boolean) => (
        requires ? (
          <Tooltip title="Töötamiseks nõutav juhi heakskiit">
            <Badge status="warning" text="Nõutav" />
          </Tooltip>
        ) : (
          <Badge status="default" text="-" />
        )
      ),
    },
    {
      title: 'Piirkond',
      dataIndex: 'is_nationwide',
      key: 'region',
      width: 100,
      align: 'center',
      render: (isNationwide: boolean) => (
        <Tag color={isNationwide ? 'green' : 'orange'} className="text-xs">
          {isNationwide ? 'Üleriigiline' : 'Piirkondlik'}
        </Tag>
      ),
    },
    {
      title: 'Allikas',
      dataIndex: 'source',
      key: 'source',
      width: 90,
      render: (source: string) => {
        const sourceConfig: Record<string, { label: string; color: string }> = {
          nager: { label: 'Nager', color: 'blue' },
          abstract: { label: 'Abstract', color: 'purple' },
          manual: { label: 'Käsitsi', color: 'green' },
        };
        const config = sourceConfig[source] || { label: source, color: 'default' };
        return (
          <Tag color={config.color} className="text-xs">
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Tegevused',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Muuda">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Kustuta">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id, record.name)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg border">
        <Select
          style={{ width: 120 }}
          value={filters.year}
          onChange={(value) => setFilters({ ...filters, year: value })}
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2).map((year) => (
            <Select.Option key={year} value={year}>
              {year}
            </Select.Option>
          ))}
        </Select>
        
        <Select
          style={{ width: 150 }}
          value={filters.countryCode}
          onChange={(value) => setFilters({ ...filters, countryCode: value })}
        >
          <Select.Option value="EE">🇪🇪 Eesti</Select.Option>
          <Select.Option value="SE">🇸🇪 Rootsi</Select.Option>
          <Select.Option value="FI">🇫🇮 Soome</Select.Option>
          <Select.Option value="LV">🇱🇻 Läti</Select.Option>
          <Select.Option value="LT">🇱🇹 Leedu</Select.Option>
          <Select.Option value="NO">🇳🇴 Norra</Select.Option>
          <Select.Option value="DK">🇩🇰 Taani</Select.Option>
        </Select>
        
        <Input.Search
          placeholder="Otsi pühade hulgast..."
          style={{ width: 300 }}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          allowClear
        />
        
        <div className="ml-auto flex gap-2">
          <Button
            type="primary"
            icon={<CloudDownloadOutlined />}
            onClick={onImport}
          >
            Impordi
          </Button>
          
          <Button
            icon={<PlusOutlined />}
            onClick={onAdd}
          >
            Lisa püha
          </Button>
          
          <Button
            icon={<DownloadOutlined />}
          >
            Ekspordi
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">
            {filteredData.length}
          </div>
          <div className="text-sm text-gray-600">Pühad kokku</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {filteredData.filter(h => h.is_paid).length}
          </div>
          <div className="text-sm text-gray-600">Tasustatud pühad</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">
            {filteredData.filter(h => h.pay_multiplier > 1.5).length}
          </div>
          <div className="text-sm text-gray-600">Topeltasu</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">
            {filteredData.filter(h => h.is_work_day).length}
          </div>
          <div className="text-sm text-gray-600">Võimalik töötada</div>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        size="small"
        scroll={{ x: 1400 }}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showTotal: (total) => `Kokku ${total} püha`,
          pageSizeOptions: ['20', '50', '100'],
        }}
        rowClassName={(record) => {
          const today = dayjs().format('YYYY-MM-DD');
          if (record.date === today) return 'bg-blue-50';
          if (record.date < today) return 'opacity-60';
          return '';
        }}
      />
    </div>
  );
}
```

### 2. Import Dialog

**Fail:** `apps/web/src/components/holidays/ImportDialog.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Modal, Form, Select, InputNumber, Alert, Steps, Spin, message } from 'antd';
import { CloudDownloadOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportDialog({ open, onClose, onSuccess }: ImportDialogProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    step: number;
    imported: number;
    total: number;
    jobId?: string;
  }>({ step: 0, imported: 0, total: 0 });

  const handleImport = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setImportStatus({ step: 1, imported: 0, total: 0 });
      
      // Start import
      const response = await fetch('/api/holidays/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: values.year,
          countryCode: values.countryCode,
          source: values.source || 'nager',
        }),
      });
      
      if (!response.ok) throw new Error('Import failed');
      
      const result = await response.json();
      setImportStatus({ step: 2, imported: 0, total: 0, jobId: result.jobId });
      
      // Poll for status
      await pollImportStatus(result.jobId);
      
    } catch (error) {
      message.error('Importimine ebaõnnestus');
      setImportStatus({ step: 0, imported: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const pollImportStatus = async (jobId: string) => {
    const maxAttempts = 30;
    let attempts = 0;
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/holidays/import/${jobId}/status`);
        const job = await response.json();
        
        if (job.status === 'completed') {
          setImportStatus({
            step: 3,
            imported: job.holidays_imported,
            total: job.holidays_imported,
          });
          message.success(`Imporditi ${job.holidays_imported} püha!`);
          onSuccess();
          setTimeout(() => {
            onClose();
            setImportStatus({ step: 0, imported: 0, total: 0 });
          }, 2000);
          return;
        }
        
        if (job.status === 'failed') {
          throw new Error(job.error_message || 'Import failed');
        }
        
        // Continue polling
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000);
        }
      } catch (error: any) {
        message.error(error.message);
        setImportStatus({ step: 0, imported: 0, total: 0 });
      }
    };
    
    poll();
  };

  const handleClose = () => {
    if (loading) return;
    form.resetFields();
    setImportStatus({ step: 0, imported: 0, total: 0 });
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CloudDownloadOutlined />
          <span>Impordi pühad</span>
        </div>
      }
      open={open}
      onOk={handleImport}
      onCancel={handleClose}
      okText="Impordi"
      cancelText="Tühista"
      confirmLoading={loading}
      okButtonProps={{ disabled: loading || importStatus.step > 0 }}
      width={600}
    >
      {importStatus.step === 0 ? (
        <>
          <Alert
            message="Automaatne import"
            description="Impordime riiklikud pühad välisest API-st. Olemasolevad pühad uuendatakse."
            type="info"
            showIcon
            className="mb-4"
          />

          <Form form={form} layout="vertical" initialValues={{ year: new Date().getFullYear(), source: 'nager' }}>
            <Form.Item
              name="year"
              label="Aasta"
              rules={[{ required: true, message: 'Vali aasta' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={2020}
                max={2030}
              />
            </Form.Item>

            <Form.Item
              name="countryCode"
              label="Riik"
              rules={[{ required: true, message: 'Vali riik' }]}
            >
              <Select placeholder="Vali riik">
                <Select.Option value="EE">🇪🇪 Eesti</Select.Option>
                <Select.Option value="SE">🇸🇪 Rootsi</Select.Option>
                <Select.Option value="FI">🇫🇮 Soome</Select.Option>
                <Select.Option value="LV">🇱🇻 Läti</Select.Option>
                <Select.Option value="LT">🇱🇹 Leedu</Select.Option>
                <Select.Option value="NO">🇳🇴 Norra</Select.Option>
                <Select.Option value="DK">🇩🇰 Taani</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="source"
              label="API Allikas"
              rules={[{ required: true, message: 'Vali allikas' }]}
            >
              <Select>
                <Select.Option value="nager">
                  Nager.Date (Soovitatav)
                </Select.Option>
                <Select.Option value="abstract">
                  Abstract API
                </Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </>
      ) : (
        <div className="py-8">
          <Steps
            current={importStatus.step - 1}
            items={[
              {
                title: 'Alustamine',
                description: 'Ühendume API-ga',
              },
              {
                title: 'Importimine',
                description: 'Laadime pühad alla',
                icon: loading ? <Spin /> : undefined,
              },
              {
                title: 'Valmis',
                description: `Imporditi ${importStatus.imported} püha`,
                icon: importStatus.step === 3 ? <CheckCircleOutlined /> : undefined,
              },
            ]}
          />
        </div>
      )}
    </Modal>
  );
}
```

### 3. Add/Edit Holiday Dialog

**Fail:** `apps/web/src/components/holidays/HolidayDialog.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Switch,
  message,
} from 'antd';
import dayjs from 'dayjs';

interface HolidayDialogProps {
  open: boolean;
  holiday?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function HolidayDialog({
  open,
  holiday,
  onClose,
  onSuccess,
}: HolidayDialogProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      loadTypes();
      if (holiday) {
        form.setFieldsValue({
          date: dayjs(holiday.date),
          name: holiday.name,
          localName: holiday.local_name,
          countryCode: holiday.country_code,
          holidayTypeId: holiday.holiday_type_id,
          isPaid: holiday.is_paid,
          payMultiplier: holiday.pay_multiplier,
          isWorkDay: holiday.is_work_day,
          requiresApproval: holiday.requires_approval,
          description: holiday.description,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, holiday, form]);

  const loadTypes = async () => {
    try {
      const response = await fetch('/api/holidays/types');
      const data = await response.json();
      setTypes(data);
    } catch (error) {
      message.error('Tüüpide laadimine ebaõnnestus');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const url = holiday
        ? `/api/holidays/${holiday.id}`
        : '/api/holidays';
      
      const method = holiday ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: values.date.format('YYYY-MM-DD'),
          name: values.name,
          localName: values.localName,
          countryCode: values.countryCode,
          holidayTypeId: values.holidayTypeId,
          isPaid: values.isPaid,
          payMultiplier: values.payMultiplier,
          isWorkDay: values.isWorkDay,
          requiresApproval: values.requiresApproval,
          description: values.description,
        }),
      });

      if (!response.ok) throw new Error('Failed');

      message.success(holiday ? 'Püha uuendatud!' : 'Püha lisatud!');
      onSuccess();
      onClose();
    } catch (error) {
      message.error('Salvestamine ebaõnnestus');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={holiday ? 'Muuda püha' : 'Lisa uus püha'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      okText="Salvesta"
      cancelText="Tühista"
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          countryCode: 'EE',
          isPaid: true,
          payMultiplier: 2.0,
          isWorkDay: false,
          requiresApproval: false,
        }}
      >
        <Form.Item
          name="date"
          label="Kuupäev"
          rules={[{ required: true, message: 'Vali kuupäev' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD.MM.YYYY"
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="name"
            label="Nimetus"
            rules={[{ required: true, message: 'Sisesta nimetus' }]}
          >
            <Input placeholder="nt. Uusaasta" />
          </Form.Item>

          <Form.Item
            name="localName"
            label="Kohalik nimetus"
          >
            <Input placeholder="nt. Uusaasta" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="countryCode"
            label="Riik"
            rules={[{ required: true, message: 'Vali riik' }]}
          >
            <Select>
              <Select.Option value="EE">🇪🇪 Eesti</Select.Option>
              <Select.Option value="SE">🇸🇪 Rootsi</Select.Option>
              <Select.Option value="FI">🇫🇮 Soome</Select.Option>
              <Select.Option value="LV">🇱🇻 Läti</Select.Option>
              <Select.Option value="LT">🇱🇹 Leedu</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="holidayTypeId"
            label="Tüüp"
          >
            <Select placeholder="Vali tüüp">
              {types.map((type) => (
                <Select.Option key={type.id} value={type.id}>
                  {type.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="description"
          label="Kirjeldus"
        >
          <Input.TextArea rows={3} />
        </Form.Item>

        <div className="border-t pt-4 space-y-3">
          <h4 className="font-medium">Töötasu reeglid</h4>

          <Form.Item
            name="isPaid"
            label="Tasustatud püha"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="payMultiplier"
            label="Töötasu kordaja"
            help="1.0 = tavaline, 1.5 = pooleteist, 2.0 = topelt, jne"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={5}
              step={0.5}
              precision={1}
              addonAfter="x"
            />
          </Form.Item>

          <Form.Item
            name="isWorkDay"
            label="Võimalik töötada"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="requiresApproval"
            label="Nõutav juhi heakskiit"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
```

### 4. Holiday Calendar View

**Fail:** `apps/web/src/components/holidays/HolidayCalendar.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Calendar, Badge, Tooltip } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

interface HolidayCalendarProps {
  year: number;
  countryCode: string;
  onDateSelect: (date: Dayjs, holidays: any[]) => void;
}

export function HolidayCalendar({
  year,
  countryCode,
  onDateSelect,
}: HolidayCalendarProps) {
  const [holidays, setHolidays] = useState<Map<string, any[]>>(new Map());

  useEffect(() => {
    loadHolidays();
  }, [year, countryCode]);

  const loadHolidays = async () => {
    try {
      const params = new URLSearchParams({
        year: year.toString(),
        countryCode,
      });
      
      const response = await fetch(`/api/holidays?${params}`);
      const data = await response.json();
      
      // Group by date
      const grouped = new Map<string, any[]>();
      data.forEach((holiday: any) => {
        const dateKey = holiday.date;
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(holiday);
      });
      
      setHolidays(grouped);
    } catch (error) {
      console.error('Failed to load holidays');
    }
  };

  const dateCellRender = (date: Dayjs) => {
    const dateKey = date.format('YYYY-MM-DD');
    const dayHolidays = holidays.get(dateKey) || [];
    
    if (dayHolidays.length === 0) return null;
    
    return (
      <ul className="space-y-1">
        {dayHolidays.map((holiday) => (
          <li key={holiday.id}>
            <Tooltip title={`${holiday.name} - ${holiday.pay_multiplier}x töötasu`}>
              <Badge
                color={holiday.type_color}
                text={
                  <span className="text-xs truncate block">
                    {holiday.name}
                  </span>
                }
              />
            </Tooltip>
          </li>
        ))}
      </ul>
    );
  };

  const handleSelect = (date: Dayjs) => {
    const dateKey = date.format('YYYY-MM-DD');
    const dayHolidays = holidays.get(dateKey) || [];
    onDateSelect(date, dayHolidays);
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <Calendar
        dateCellRender={dateCellRender}
        onSelect={handleSelect}
      />
    </div>
  );
}
```

---

Jätkan järgmises osas page ja SQL migratsiooniga...

**Kas jätkan? 🚀**
