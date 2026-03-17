import { useEffect, useState } from 'react';

const emptyForm = {
  title: '',
  description: '',
  startAt: '',
  endAt: '',
};

function formatDatetimeLocal(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export default function TaskForm({ editingTask, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description,
        startAt: formatDatetimeLocal(editingTask.startAt),
        endAt: formatDatetimeLocal(editingTask.endAt),
      });
      return;
    }

    setFormData(emptyForm);
  }, [editingTask]);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!formData.title.trim()) {
      window.alert('请输入任务名称');
      return;
    }

    if (!formData.startAt || !formData.endAt) {
      window.alert('请选择开始和结束时间');
      return;
    }

    if (new Date(formData.startAt) >= new Date(formData.endAt)) {
      window.alert('结束时间必须晚于开始时间');
      return;
    }

    onSubmit({
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
    });
  }

  const actionText = editingTask ? '保存修改' : '创建任务';

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>{editingTask ? '编辑任务' : '新建任务'}</h2>
      <label>
        任务标题
        <input
          name="title"
          placeholder="例如：准备周会汇报"
          value={formData.title}
          onChange={updateField}
        />
      </label>

      <label>
        开始时间
        <input
          name="startAt"
          type="datetime-local"
          value={formData.startAt}
          onChange={updateField}
        />
      </label>

      <label>
        结束时间
        <input
          name="endAt"
          type="datetime-local"
          value={formData.endAt}
          onChange={updateField}
        />
      </label>

      <label>
        任务描述
        <textarea
          name="description"
          rows="3"
          placeholder="写下关键事项或准备材料"
          value={formData.description}
          onChange={updateField}
        />
      </label>

      <div className="form-actions">
        <button type="submit">{actionText}</button>
        {editingTask ? (
          <button type="button" className="secondary" onClick={onCancel}>
            取消编辑
          </button>
        ) : null}
      </div>
    </form>
  );
}