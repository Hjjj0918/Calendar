import { useEffect, useMemo, useState } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';

const STORAGE_KEY = 'calendar-reminder-tasks';

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('浏览器不支持通知功能');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('已获得通知权限');
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('用户已拒绝通知权限，请在浏览器设置中启用');
    return false;
  }

  // permission === 'default'，请求权限
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('用户同意了通知权限');
      // 发送测试通知
      new Notification('✅ 提醒功能已启用', {
        body: '你将在任务时间即将到达时收到桌面通知',
        icon: '/favicon.ico',
      });
    } else {
      console.warn('用户拒绝了通知权限');
    }
  });
  return false;
}

function notify(title, body, options = {}) {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  // 使用系统通知的配置选项
  const notificationOptions = {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: options.tag || 'reminder',
    requireInteraction: options.requireInteraction ?? true,
    ...options,
  };

  new Notification(title, notificationOptions);

  // 如果支持音频，播放通知音
  if ('AudioContext' in window || 'webkitAudioContext' in window) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      // 播放两个短音调
      oscillator.frequency.value = 800;
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // 忽略音频播放错误
    }
  }
}

function loadTasks() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((task) => ({
      ...task,
      archived: Boolean(task.archived),
    }));
  } catch (error) {
    return [];
  }
}

function upsertTask(taskList, task, editingTaskId) {
  if (!editingTaskId) {
    return [task, ...taskList];
  }

  return taskList.map((item) => (item.id === editingTaskId ? task : item));
}

function clearNotifyFlags(previousMap, taskId) {
  const nextMap = { ...previousMap };
  delete nextMap[`${taskId}-near`];
  delete nextMap[`${taskId}-start`];
  return nextMap;
}

export default function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [editingTask, setEditingTask] = useState(null);
  const [toast, setToast] = useState('');
  const [notifiedMap, setNotifiedMap] = useState({});
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  useEffect(() => {
    requestNotificationPermission();
    // 检查通知权限状态
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationEnabled(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();

      tasks.filter((task) => !task.archived).forEach((task) => {
        const start = new Date(task.startAt).getTime();
        const end = new Date(task.endAt).getTime();

        // 15分钟提前提醒
        const timeUntilStart = start - now;
        const nearStart = timeUntilStart <= 15 * 60 * 1000 && timeUntilStart > 0;
        const inRange = now >= start && now <= end;

        if (nearStart && !notifiedMap[`${task.id}-near`]) {
          const minutesLeft = Math.ceil(timeUntilStart / 60 / 1000);
          notify(
            '📋 任务即将开始',
            `${task.title}\n距离开始时间还有 ${minutesLeft} 分钟`,
            { tag: `task-${task.id}-near` }
          );
          setToast(`⏰ 提醒：${task.title} 即将在 ${minutesLeft} 分钟后开始`);
          setNotifiedMap((prev) => ({ ...prev, [`${task.id}-near`]: true }));
        }

        if (inRange && !notifiedMap[`${task.id}-start`]) {
          notify(
            '🔔 任务时间到！',
            `${task.title}\n任务已开始，请立即开展工作`,
            { tag: `task-${task.id}-start`, requireInteraction: true }
          );
          setToast(`🎯 ${task.title} 已开始！`);
          setNotifiedMap((prev) => ({ ...prev, [`${task.id}-start`]: true }));
        }
      });
    }, 10 * 1000);

    return () => window.clearInterval(timer);
  }, [tasks, notifiedMap]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function handleSubmit(formData) {
    const taskId = editingTask ? editingTask.id : crypto.randomUUID();
    const payload = {
      id: taskId,
      title: formData.title,
      description: formData.description,
      startAt: new Date(formData.startAt).toISOString(),
      endAt: new Date(formData.endAt).toISOString(),
      archived: editingTask?.archived ?? false,
    };

    setTasks((previous) =>
      upsertTask(previous, payload, editingTask?.id).sort(
        (a, b) => new Date(a.startAt) - new Date(b.startAt)
      )
    );

    setNotifiedMap((previous) => clearNotifyFlags(previous, taskId));
    setEditingTask(null);
    setToast(editingTask ? '任务已更新' : '任务已创建');
  }

  function handleDelete(taskId) {
    setTasks((previous) => previous.filter((item) => item.id !== taskId));
    setEditingTask((previous) => (previous?.id === taskId ? null : previous));
    setNotifiedMap((previous) => clearNotifyFlags(previous, taskId));
    setToast('任务已删除');
  }

  function handleArchive(taskId) {
    setTasks((previous) =>
      previous.map((item) => (item.id === taskId ? { ...item, archived: true } : item))
    );
    setEditingTask((previous) => (previous?.id === taskId ? null : previous));
    setNotifiedMap((previous) => clearNotifyFlags(previous, taskId));
    setToast('任务已归档');
  }

  function handleUnarchive(taskId) {
    setTasks((previous) =>
      previous.map((item) => (item.id === taskId ? { ...item, archived: false } : item))
    );
    setNotifiedMap((previous) => clearNotifyFlags(previous, taskId));
    setToast('任务已取消归档');
  }

  const activeTasks = useMemo(() => tasks.filter((task) => !task.archived), [tasks]);
  const archivedTasks = useMemo(() => tasks.filter((task) => task.archived), [tasks]);

  const summary = useMemo(() => {
    const now = Date.now();
    const active = activeTasks.filter((task) => {
      const start = new Date(task.startAt).getTime();
      const end = new Date(task.endAt).getTime();
      return now >= start && now <= end;
    }).length;

    return {
      total: activeTasks.length,
      active,
      upcoming: activeTasks.filter((task) => new Date(task.startAt).getTime() > now).length,
    };
  }, [activeTasks]);

  return (
    <main className="app-shell">
      <header className="hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <p className="kicker">Personal Reminder Plugin</p>
            <h1>时间段任务提醒</h1>
            <p>为每天的重要事项设置开始和结束时间，自动给你提醒。</p>
          </div>
          <div
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              backgroundColor: notificationEnabled ? '#d4edda' : '#fff3cd',
              color: notificationEnabled ? '#155724' : '#856404',
              border: '1px solid',
              borderColor: notificationEnabled ? '#c3e6cb' : '#ffeeba',
            }}
          >
            {notificationEnabled ? '✅ 通知已启用' : '⚠️ 通知未启用'}
          </div>
        </div>
        <div className="summary-cards">
          <article>
            <span>总任务</span>
            <strong>{summary.total}</strong>
          </article>
          <article>
            <span>进行中</span>
            <strong>{summary.active}</strong>
          </article>
          <article>
            <span>待开始</span>
            <strong>{summary.upcoming}</strong>
          </article>
        </div>
      </header>

      <section className="layout-grid">
        <TaskForm
          editingTask={editingTask}
          onSubmit={handleSubmit}
          onCancel={() => setEditingTask(null)}
        />
        <div className="list-column">
          <TaskList
            title="任务列表"
            emptyMessage="还没有任务，先创建一个时间段提醒吧。"
            tasks={activeTasks}
            onEdit={setEditingTask}
            onDelete={handleDelete}
            onArchive={handleArchive}
          />
          <TaskList
            title="已归档任务"
            emptyMessage="暂无已归档任务。"
            tasks={archivedTasks}
            archiveButtonText="取消归档"
            onArchive={handleUnarchive}
            onDelete={handleDelete}
            statusLabel="已归档"
          />
        </div>
      </section>

      {toast ? <div className="toast">{toast}</div> : null}
    </main>
  );
}
