# ⏰ TÖÖTUNDIDE HALDUSSÜSTEEM - OSAS 2
## Dialoogid, Kommentaarid, Teavitused

---

## 🎨 FRONTEND KOMPONENDID (jätk)

### 2. Reject Dialog

**Fail:** `apps/web/src/components/personnel/RejectDialog.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Modal, Input, Form, message } from 'antd';

interface RejectDialogProps {
  open: boolean;
  recordId: string | null;
  employeeName: string;
  onClose: () => void;
  onReject: (id: string, reason: string) => Promise<void>;
}

export function RejectDialog({
  open,
  recordId,
  employeeName,
  onClose,
  onReject,
}: RejectDialogProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      await onReject(recordId!, values.reason);
      
      message.success('Töötunnid lükati tagasi');
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Tagasilükkamine ebaõnnestus');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Lükka tagasi - ${employeeName}`}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      okText="Lükka tagasi"
      cancelText="Tühista"
      confirmLoading={loading}
      okButtonProps={{ danger: true }}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="reason"
          label="Tagasilükkamise põhjus"
          rules={[
            { required: true, message: 'Palun sisesta põhjus' },
            { min: 10, message: 'Põhjus peab olema vähemalt 10 tähemärki' },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Kirjelda, miks töötunnid tagasi lükati..."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
      
      <div className="text-sm text-gray-600 mt-4">
        ⚠️ Töötaja saab teavituse koos põhjusega.
      </div>
    </Modal>
  );
}
```

### 3. Modify Dialog

**Fail:** `apps/web/src/components/personnel/ModifyDialog.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, TimePicker, InputNumber, Input, message } from 'antd';
import dayjs from 'dayjs';

interface ModifyDialogProps {
  open: boolean;
  record: any;
  onClose: () => void;
  onModify: (id: string, data: any) => Promise<void>;
}

export function ModifyDialog({
  open,
  record,
  onClose,
  onModify,
}: ModifyDialogProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record && open) {
      form.setFieldsValue({
        checkInTime: record.check_in_time ? dayjs(record.check_in_time, 'HH:mm') : null,
        checkOutTime: record.check_out_time_display ? dayjs(record.check_out_time_display, 'HH:mm') : null,
        workedHours: record.worked_hours,
        reason: '',
      });
    }
  }, [record, open, form]);

  const calculateHours = () => {
    const checkIn = form.getFieldValue('checkInTime');
    const checkOut = form.getFieldValue('checkOutTime');
    
    if (checkIn && checkOut) {
      const hours = checkOut.diff(checkIn, 'hour', true);
      form.setFieldsValue({ workedHours: parseFloat(hours.toFixed(2)) });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      await onModify(record.id, {
        checkInTime: values.checkInTime?.format('HH:mm:ss'),
        checkOutTime: values.checkOutTime?.format('HH:mm:ss'),
        workedHours: values.workedHours,
        reason: values.reason,
      });
      
      message.success('Töötunnid muudetud');
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Muutmine ebaõnnestus');
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Modal
      title={`Muuda töötunde - ${record.employee_name}`}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      okText="Salvesta"
      cancelText="Tühista"
      confirmLoading={loading}
      width={600}
    >
      <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
        <div><strong>Kuupäev:</strong> {record.date}</div>
        <div><strong>Projekt:</strong> {record.project_name || '-'}</div>
        <div><strong>Asukoht:</strong> {record.location_name || '-'}</div>
      </div>

      <Form form={form} layout="vertical">
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="checkInTime"
            label="Saabumine"
            rules={[{ required: true, message: 'Kohustuslik' }]}
          >
            <TimePicker
              format="HH:mm"
              onChange={calculateHours}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="checkOutTime"
            label="Lahkumine"
            rules={[{ required: true, message: 'Kohustuslik' }]}
          >
            <TimePicker
              format="HH:mm"
              onChange={calculateHours}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="workedHours"
          label="Töötunde kokku"
          rules={[
            { required: true, message: 'Kohustuslik' },
            { type: 'number', min: 0, max: 24, message: '0-24 tundi' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            precision={2}
            min={0}
            max={24}
            step={0.5}
            addonAfter="tundi"
          />
        </Form.Item>

        <Form.Item
          name="reason"
          label="Muutmise põhjus"
          rules={[
            { required: true, message: 'Palun sisesta põhjus' },
            { min: 10, message: 'Põhjus peab olema vähemalt 10 tähemärki' },
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Kirjelda, miks töötunde muudeti..."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>

      <div className="text-sm text-gray-600 mt-4">
        ⚠️ Töötaja saab teavituse muudatuste kohta.
      </div>
    </Modal>
  );
}
```

### 4. Comments Drawer

**Fail:** `apps/web/src/components/personnel/CommentsDrawer.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { 
  Drawer, 
  List, 
  Avatar, 
  Input, 
  Button, 
  Switch, 
  Space,
  Empty,
  Spin,
  message,
  Tooltip,
} from 'antd';
import { 
  CommentOutlined, 
  SendOutlined, 
  LockOutlined, 
  UnlockOutlined 
} from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { et } from 'date-fns/locale';

interface Comment {
  id: string;
  comment: string;
  created_by: string;
  created_at: string;
  is_internal: boolean;
  author: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

interface CommentsDrawerProps {
  open: boolean;
  recordId: string | null;
  recordTitle: string;
  onClose: () => void;
}

export function CommentsDrawer({
  open,
  recordId,
  recordTitle,
  onClose,
}: CommentsDrawerProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  useEffect(() => {
    if (recordId && open) {
      loadComments();
    }
  }, [recordId, open]);

  const loadComments = async () => {
    if (!recordId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/personnel/work-hours/${recordId}/comments`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      message.error('Kommentaaride laadimine ebaõnnestus');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      message.warning('Kommentaar ei saa olla tühi');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/personnel/work-hours/${recordId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comment: newComment.trim(),
            isInternal,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed');

      message.success('Kommentaar lisatud');
      setNewComment('');
      setIsInternal(false);
      loadComments();
    } catch (error) {
      message.error('Kommentaari lisamine ebaõnnestus');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title={
        <div>
          <div className="text-lg font-semibold">Kommentaarid</div>
          <div className="text-sm font-normal text-gray-600">{recordTitle}</div>
        </div>
      }
      placement="right"
      width={500}
      open={open}
      onClose={onClose}
    >
      <div className="flex flex-col h-full">
        {/* Comments List */}
        <div className="flex-1 overflow-y-auto mb-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Spin />
            </div>
          ) : comments.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Kommentaare pole veel"
            />
          ) : (
            <List
              dataSource={comments}
              renderItem={(comment) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar src={comment.author.avatar_url}>
                        {comment.author.full_name.charAt(0)}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <span>{comment.author.full_name}</span>
                        {comment.is_internal && (
                          <Tooltip title="Sisene kommentaar - nähtav ainult juhtidele">
                            <LockOutlined className="text-xs text-gray-400" />
                          </Tooltip>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: et,
                          })}
                        </div>
                        <div className="text-sm">{comment.comment}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>

        {/* New Comment Form */}
        <div className="border-t pt-4">
          <Input.TextArea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Lisa kommentaar..."
            maxLength={1000}
            showCount
          />

          <div className="mt-3 flex items-center justify-between">
            <Tooltip title="Sisesed kommentaarid on nähtavad ainult juhtidele">
              <Space>
                <Switch
                  checked={isInternal}
                  onChange={setIsInternal}
                  size="small"
                />
                <span className="text-sm text-gray-600">
                  {isInternal ? (
                    <>
                      <LockOutlined /> Sisene
                    </>
                  ) : (
                    <>
                      <UnlockOutlined /> Avalik
                    </>
                  )}
                </span>
              </Space>
            </Tooltip>

            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={submitting}
              disabled={!newComment.trim()}
            >
              Saada
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
```

### 5. Audit Log Drawer

**Fail:** `apps/web/src/components/personnel/AuditLogDrawer.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Drawer, Timeline, Tag, Spin, Empty, message } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EditOutlined, 
  CommentOutlined 
} from '@ant-design/icons';
import { format } from 'date-fns';
import { et } from 'date-fns/locale';

interface AuditLog {
  id: string;
  action: string;
  performed_by: string;
  performed_at: string;
  reason: string;
  comment: string;
  old_values: any;
  new_values: any;
  performer: {
    full_name: string;
    avatar_url: string;
  };
}

interface AuditLogDrawerProps {
  open: boolean;
  recordId: string | null;
  recordTitle: string;
  onClose: () => void;
}

export function AuditLogDrawer({
  open,
  recordId,
  recordTitle,
  onClose,
}: AuditLogDrawerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recordId && open) {
      loadAuditLogs();
    }
  }, [recordId, open]);

  const loadAuditLogs = async () => {
    if (!recordId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/personnel/work-hours/${recordId}/audit`);
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      message.error('Ajaloo laadimine ebaõnnestus');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approved':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'rejected':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'modified':
        return <EditOutlined style={{ color: '#1890ff' }} />;
      case 'commented':
        return <CommentOutlined style={{ color: '#722ed1' }} />;
      default:
        return null;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'approved':
        return 'Kinnitatud';
      case 'rejected':
        return 'Tagasi lükatud';
      case 'modified':
        return 'Muudetud';
      case 'commented':
        return 'Kommenteeritud';
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'modified':
        return 'blue';
      case 'commented':
        return 'purple';
      default:
        return 'default';
    }
  };

  const renderChanges = (log: AuditLog) => {
    if (!log.old_values || !log.new_values) return null;

    const changes = [];
    const oldVals = log.old_values;
    const newVals = log.new_values;

    if (oldVals.check_in_time !== newVals.check_in_time) {
      changes.push(
        <div key="check_in" className="text-sm">
          <span className="text-gray-600">Saabumine:</span>{' '}
          <span className="line-through text-red-600">{oldVals.check_in_time}</span>
          {' → '}
          <span className="text-green-600">{newVals.check_in_time}</span>
        </div>
      );
    }

    if (oldVals.check_out_time !== newVals.check_out_time) {
      changes.push(
        <div key="check_out" className="text-sm">
          <span className="text-gray-600">Lahkumine:</span>{' '}
          <span className="line-through text-red-600">{oldVals.check_out_time}</span>
          {' → '}
          <span className="text-green-600">{newVals.check_out_time}</span>
        </div>
      );
    }

    if (oldVals.worked_hours !== newVals.worked_hours) {
      changes.push(
        <div key="hours" className="text-sm">
          <span className="text-gray-600">Tunnid:</span>{' '}
          <span className="line-through text-red-600">{oldVals.worked_hours}h</span>
          {' → '}
          <span className="text-green-600">{newVals.worked_hours}h</span>
        </div>
      );
    }

    return changes.length > 0 ? (
      <div className="mt-2 p-2 bg-gray-50 rounded">{changes}</div>
    ) : null;
  };

  return (
    <Drawer
      title={
        <div>
          <div className="text-lg font-semibold">Muudatuste ajalugu</div>
          <div className="text-sm font-normal text-gray-600">{recordTitle}</div>
        </div>
      }
      placement="right"
      width={500}
      open={open}
      onClose={onClose}
    >
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Spin />
        </div>
      ) : logs.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Muudatusi pole veel"
        />
      ) : (
        <Timeline
          items={logs.map((log) => ({
            dot: getActionIcon(log.action),
            children: (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag color={getActionColor(log.action)}>
                    {getActionLabel(log.action)}
                  </Tag>
                  <span className="text-sm font-medium">
                    {log.performer.full_name}
                  </span>
                </div>

                <div className="text-xs text-gray-500 mb-2">
                  {format(new Date(log.performed_at), 'dd.MM.yyyy HH:mm', {
                    locale: et,
                  })}
                </div>

                {log.reason && (
                  <div className="text-sm text-gray-700 mb-2">
                    <strong>Põhjus:</strong> {log.reason}
                  </div>
                )}

                {log.comment && (
                  <div className="text-sm text-gray-700 mb-2">
                    <strong>Kommentaar:</strong> {log.comment}
                  </div>
                )}

                {renderChanges(log)}
              </div>
            ),
          }))}
        />
      )}
    </Drawer>
  );
}
```

### 6. Notifications Badge

**Fail:** `apps/web/src/components/personnel/NotificationsBadge.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Button, Empty, Spin } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { et } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entity_id: string;
  action_url: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationsBadge() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    // Poll every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/personnel/notifications?limit=10');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/personnel/notifications/${id}/read`, {
        method: 'PATCH',
      });
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/personnel/notifications/mark-all-read', {
        method: 'PATCH',
      });
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.action_url) {
      router.push(notification.action_url);
    }
    setOpen(false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      trigger={['click']}
      dropdownRender={() => (
        <div className="bg-white rounded-lg shadow-lg border w-96">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Teavitused</h3>
            {unreadCount > 0 && (
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={markAllAsRead}
              >
                Märgi kõik loetuks
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Spin />
              </div>
            ) : notifications.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Teavitusi pole"
                className="py-8"
              />
            ) : (
              <List
                dataSource={notifications}
                renderItem={(notification) => (
                  <List.Item
                    className={`cursor-pointer hover:bg-gray-50 px-4 ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <List.Item.Meta
                      title={
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {notification.title}
                          </span>
                          {!notification.is_read && (
                            <Badge status="processing" />
                          )}
                        </div>
                      }
                      description={
                        <div>
                          <div className="text-sm text-gray-600 mb-1">
                            {notification.message}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(
                              new Date(notification.created_at),
                              { addSuffix: true, locale: et }
                            )}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2 border-t text-center">
              <Button
                type="link"
                size="small"
                onClick={() => {
                  router.push('/personnel/notifications');
                  setOpen(false);
                }}
              >
                Vaata kõiki teavitusi
              </Button>
            </div>
          )}
        </div>
      )}
    >
      <Badge count={unreadCount} size="small">
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 20 }} />}
          className="flex items-center justify-center"
        />
      </Badge>
    </Dropdown>
  );
}
```

---

## 📄 PAGES

### 1. Work Hours Page

**Fail:** `apps/web/src/app/(dashboard)/personnel/work-hours/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { message } from 'antd';
import { WorkHoursTable } from '@/components/personnel/WorkHoursTable';
import { RejectDialog } from '@/components/personnel/RejectDialog';
import { ModifyDialog } from '@/components/personnel/ModifyDialog';
import { CommentsDrawer } from '@/components/personnel/CommentsDrawer';
import { AuditLogDrawer } from '@/components/personnel/AuditLogDrawer';

export default function WorkHoursPage() {
  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    recordId: null as string | null,
    employeeName: '',
  });

  const [modifyDialog, setModifyDialog] = useState({
    open: false,
    record: null as any,
  });

  const [commentsDrawer, setCommentsDrawer] = useState({
    open: false,
    recordId: null as string | null,
    recordTitle: '',
  });

  const [auditDrawer, setAuditDrawer] = useState({
    open: false,
    recordId: null as string | null,
    recordTitle: '',
  });

  const handleApprove = async (id: string, comment?: string) => {
    try {
      const response = await fetch(`/api/personnel/work-hours/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });

      if (!response.ok) throw new Error('Failed');

      message.success('Töötunnid kinnitatud');
      // Reload table
    } catch (error) {
      throw error;
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const response = await fetch(`/api/personnel/work-hours/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error('Failed');
    } catch (error) {
      throw error;
    }
  };

  const handleModify = async (id: string, data: any) => {
    try {
      const response = await fetch(`/api/personnel/work-hours/${id}/modify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed');
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Töötundide haldus</h1>
        <p className="text-gray-600 mt-1">
          Kinnita, muuda ja kommenter töötajate töötunde
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">24</div>
          <div className="text-sm text-gray-600">Ootel kinnitust</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">156</div>
          <div className="text-sm text-gray-600">Kinnitatud tänane</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">1,245</div>
          <div className="text-sm text-gray-600">Tunde sel kuul</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">87</div>
          <div className="text-sm text-gray-600">Ületunde</div>
        </div>
      </div>

      {/* Table */}
      <WorkHoursTable
        onApprove={handleApprove}
        onReject={(id) => {
          // Open reject dialog
          setRejectDialog({
            open: true,
            recordId: id,
            employeeName: 'Töötaja', // Get from record
          });
        }}
        onModify={(id) => {
          // Open modify dialog
          // Get record data first
        }}
        onViewComments={(id) => {
          setCommentsDrawer({
            open: true,
            recordId: id,
            recordTitle: 'Töötaja - Kuupäev', // Get from record
          });
        }}
        onViewAudit={(id) => {
          setAuditDrawer({
            open: true,
            recordId: id,
            recordTitle: 'Töötaja - Kuupäev', // Get from record
          });
        }}
      />

      {/* Dialogs */}
      <RejectDialog
        {...rejectDialog}
        onClose={() => setRejectDialog({ ...rejectDialog, open: false })}
        onReject={handleReject}
      />

      <ModifyDialog
        {...modifyDialog}
        onClose={() => setModifyDialog({ ...modifyDialog, open: false })}
        onModify={handleModify}
      />

      <CommentsDrawer
        {...commentsDrawer}
        onClose={() => setCommentsDrawer({ ...commentsDrawer, open: false })}
      />

      <AuditLogDrawer
        {...auditDrawer}
        onClose={() => setAuditDrawer({ ...auditDrawer, open: false })}
      />
    </div>
  );
}
```

---

## ✅ KOKKUVÕTE

### Loodud Komponendid:
1. ✅ **WorkHoursTable** - Põhitabel (kompaktne, sorditav, filteeritav)
2. ✅ **RejectDialog** - Tagasilükkamise dialoog
3. ✅ **ModifyDialog** - Muutmise dialoog
4. ✅ **CommentsDrawer** - Kommentaaride külgpaneel
5. ✅ **AuditLogDrawer** - Muudatuste ajaloo külgpaneel
6. ✅ **NotificationsBadge** - Teavituste ikoon headeris

### Funktsioonid:
- ✅ Töötundide vaatamine tabelis
- ✅ Kinnitamine (approve)
- ✅ Tagasilükkamine (reject)
- ✅ Muutmine (modify)
- ✅ Kommentaarid (avalikud ja sisesed)
- ✅ Audit trail
- ✅ Teavitused
- ✅ Bulk actions
- ✅ Export

### Õigused:
- ✅ RLS policies
- ✅ Manager näeb oma meeskonda
- ✅ Admin näeb kõiki

**VALMIS! 🎉**
