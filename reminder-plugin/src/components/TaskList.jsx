import { useMemo } from 'react';

function formatDate(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusOf(task, now) {
  const start = new Date(task.startAt).getTime();
  const end = new Date(task.endAt).getTime();
  if (now >= start && now <= end) {
    return '进行中';
  }
  if (now < start) {
    return '未开始';
  }
  return '已结束';
}

export default function TaskList({
  title = '任务列表',
  emptyMessage = '还没有任务，先创建一个时间段提醒吧。',
  archiveButtonText = '归档',
  tasks,
  bulkActionText,
  onBulkAction,
  onEdit,
  onDelete,
  onArchive,
  statusLabel,
  searchQuery = '',
  onSearchQueryChange,
  searchPlaceholder = '搜索任务标题或描述',
}) {
  const now = Date.now();

  const filteredTasks = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) {
      return tasks;
    }

    return tasks.filter((task) => {
      const title = task.title.toLowerCase();
      const description = (task.description || '').toLowerCase();
      return title.includes(keyword) || description.includes(keyword);
    });
  }, [tasks, searchQuery]);

  const hasBulkAction = Boolean(onBulkAction && filteredTasks.length);
  const hasSearch = typeof onSearchQueryChange === 'function';

  if (!tasks.length) {
    return (
      <section className="task-list empty-state">
        <div className="task-list-head">
          <h2>{title}</h2>
        </div>
        <p>{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="task-list">
      <div className="task-list-head">
        <h2>{title}</h2>
        {hasBulkAction ? (
          <button type="button" className="secondary bulk-action" onClick={onBulkAction}>
            {bulkActionText}
          </button>
        ) : null}
      </div>
      {hasSearch ? (
        <label className="task-search" aria-label={`${title}搜索`}>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>
      ) : null}
      {!filteredTasks.length ? (
        <p className="search-empty">没有找到匹配的任务，请尝试其他关键词。</p>
      ) : null}
      <ul>
        {filteredTasks.map((task) => {
          const status = statusLabel || statusOf(task, now);
          return (
            <li key={task.id} className="task-item">
              <div className="task-head">
                <strong>{task.title}</strong>
                <span className={`status status-${status}`}>{status}</span>
              </div>
              <p className="time-range">
                {formatDate(task.startAt)} - {formatDate(task.endAt)}
              </p>
              {task.description ? <p className="description">{task.description}</p> : null}
              <div className="task-actions">
                {onEdit ? (
                  <button type="button" onClick={() => onEdit(task)}>
                    编辑
                  </button>
                ) : null}
                {onArchive ? (
                  <button type="button" className="secondary" onClick={() => onArchive(task.id)}>
                    {archiveButtonText}
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => onDelete(task.id)}
                  >
                    删除
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}