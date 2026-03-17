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

export default function TaskList({ tasks, onEdit, onDelete }) {
  const now = Date.now();

  if (!tasks.length) {
    return (
      <section className="task-list empty-state">
        <h2>任务列表</h2>
        <p>还没有任务，先创建一个时间段提醒吧。</p>
      </section>
    );
  }

  return (
    <section className="task-list">
      <h2>任务列表</h2>
      <ul>
        {tasks.map((task) => {
          const status = statusOf(task, now);
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
                <button type="button" onClick={() => onEdit(task)}>
                  编辑
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => onDelete(task.id)}
                >
                  删除
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}