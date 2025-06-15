<script lang="ts">
  import { slide, fly, fade } from 'svelte/transition';
  import { onMount } from 'svelte';
import {
  loadPins,
  addPin as addPinToDB,
  deletePinById,
  updatePinById
} from '$lib/pinService';
import {
  loadTasks,
  addTask as addTaskToDB,
  toggleTaskDone as updateTaskDone,
  deleteTask as deleteTaskFromDB
} from '$lib/taskService';
import { loadCategoryOptions, addCategoryOption } from '$lib/categoryService';

  const rows = ['I','H','G','F','E','D','C','B','A'];
  const cols = [1,2,3,4,5,6,7,8,9];

  type Category = { name: string; color: string };
  type Pin = {
    tile: string;
    x: number;
    y: number;
    category: string;
    color: string;
    memo: string;
    important: boolean;
    createdAt: string;
  };

  let pins: Pin[] = [];

  import { supabase } from '$lib/supabase';

onMount(async () => {
  const { data, error } = await supabase.from('pins').select('*');
  if (!error) pins = data;
});

  let categories: Category[] = [{ name: '素材', color: '#00bfff' }];

  let newCategoryName = '';
  let newCategoryColor = '#ffffff';

  let selectedCategory: string = '';
  let memo = '';
  let zoom = 1;

  let filterCategories: string[] = [];
  let sortMode: 'created' | 'tile' | 'color' = 'created';

  let editingIndex: number | null = null;
  let openSection: string = 'pin';

  let tileName = ''
  let tileMemo = ''
  let tileFile: File | null = null
  

  function toggleAccordion(section: string) {
    openSection = openSection === section ? '' : section;
  }

  async function addPin(tile: string, e: MouseEvent) {
  const rect = (e.target as HTMLElement).getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  const color = categories.find(c => c.name === selectedCategory)?.color ?? '#fff';
  const createdAt = new Date().toISOString();
  const category = selectedCategory

  const newPin = {
    tile,
    x,
    y,
    category: selectedCategory,
    color,
    memo,
    important: false,
     created_at: new Date().toISOString(),
  };

  try {
    const inserted = await addPinToDB(newPin);
    pins = [...pins, inserted];
    memo = '';
  } catch (err) {
    console.error('ピン追加失敗:', err);
  }
}

  async function deletePin(index: number) {
  const pin = pins[index];
  try {
    await deletePinById(pin.id);
    pins = pins.filter((_, i) => i !== index);
    editingIndex = null;
    memo = '';
  } catch (err) {
    console.error('削除失敗:', err);
  }
}

  function startEdit(index: number) {
    const pin = pins[index];
    editingIndex = index;
    selectedCategory = pin.category;
    memo = pin.memo;
  }

  async function saveEdit() {
  if (editingIndex !== null) {
    const updated = [...pins];
    const pin = updated[editingIndex];
    pin.category = selectedCategory;
    pin.color = categories.find(c => c.name === selectedCategory)?.color ?? pin.color;
    pin.memo = memo;
    try {
      await updatePinById(pin.id, pin);
      pins = updated;
      editingIndex = null;
      memo = '';
    } catch (err) {
      console.error('編集失敗:', err);
    }
  }
}

  function cancelEdit() {
    editingIndex = null;
    memo = '';
  }

  async function addCategory() {
  if (!newCategoryName.trim()) return;
  try {
    const added = await addCategoryOption(newCategoryName.trim(), newCategoryColor);
    categories = [...categories, added];
    newCategoryName = '';
    newCategoryColor = '#ffffff';
  } catch (err) {
    console.error('カテゴリ追加失敗:', err);
  }
}

  function toggleFilter(cat: string) {
    if (filterCategories.includes(cat)) {
      filterCategories = filterCategories.filter(c => c !== cat);
    } else {
      filterCategories = [...filterCategories, cat];
    }
  }

  async function toggleImportant(index: number) {
  pins[index].important = !pins[index].important;
  try {
    await updatePinById(pins[index].id, pins[index]);
  } catch (err) {
    console.error('重要ピン更新失敗:', err);
  }
}

  function getSortedPins(): Pin[] {
    const filtered = filterCategories.length > 0
      ? pins.filter(p => filterCategories.includes(p.category))
      : pins;

    if (sortMode === 'tile') return [...filtered].sort((a, b) => a.tile.localeCompare(b.tile));
    if (sortMode === 'color') return [...filtered].sort((a, b) => a.color.localeCompare(b.color));
    return filtered;
  }

  type Task = {
  id: string;
  datetime: string;
  message: string;
  linked_pin_id: string | null;
  done: boolean;
};

let tasks: Task[] = [];
let taskDate = '';
let taskTime = '';
let taskMessage = '';
let selectedPinIndex: number | null = null;
let taskIdCounter = 1;

async function addTask() {
  if (!taskDate || !taskTime || !taskMessage.trim()) return;
  const dt = `${taskDate} ${taskTime}`;
  const task = {
    datetime: dt,
    message: taskMessage.trim(),
    linked_pin_id: selectedPinIndex !== null ? pins[selectedPinIndex].id : null,
    done: false
  };
  try {
    const newTask = await addTaskToDB(task);
    tasks = [...tasks, newTask];
    taskMessage = '';
    taskDate = '';
    taskTime = '';
    selectedPinIndex = null;
  } catch (err) {
    console.error('タスク追加失敗:', err);
  }
}

function getPinLabel(index: number) {
  const p = pins[index];
  return `${p.tile} / ${p.category}${p.memo ? ` - ${p.memo}` : ''}`;
}

async function toggleTaskDone(id: string, done: boolean) {
  await updateTaskDone(id, !done);
  tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
}

async function deleteTask(id: string) {
  await deleteTaskFromDB(id);
  tasks = tasks.filter(t => t.id !== id);
}

// ピンに紐づいたタスクがあるかどうかチェック
function isPinLinkedToTask(index: number) {
  return tasks.some(t => t.linkedPinIndex === index && !t.done);
}

onMount(async () => {
  try {
    pins = await loadPins();
  } catch (err) {
    console.error('ピンの読み込みに失敗:', err);
  }
});

onMount(async () => {
  try {
    categories = await loadCategoryOptions();
    if (categories.length > 0) {
      selectedCategory = categories[0].name;
    }
    pins = await loadPins();
    tasks = await loadTasks();
  } catch (err) {
    console.error('読み込み失敗:', err);
  }
});

</script>

<style>
  :global(body) {
    background: #121218;
    color: #f0f0f0;
    font-family: 'Segoe UI', sans-serif;
    margin: 0;
    padding: 2rem;
  }

  .layout {
    display: flex;
    gap: 1.5rem;
  }

  .form-card {
    background: #1e1e2a;
    border-radius: 1rem;
    padding: 1rem;
    width: 280px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .accordion-section {
    margin-bottom: 1rem;
  }

  .accordion-title {
    cursor: pointer;
    font-weight: bold;
    padding: 0.5rem;
    background: #2a2a3d;
    border-radius: 0.5rem;
    margin-bottom: 0.3rem;
  }

  .accordion-content {
    padding-left: 0.5rem;
  }

  input, select {
    width: 100%;
    margin: 0.3rem 0;
    padding: 0.6rem;
    border: none;
    border-radius: 0.5rem;
    background: #2b2b3d;
    color: white;
  }

  button {
    background: #0070f3;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    margin: 0.3rem 0.5rem 0 0;
    transition: transform 0.1s ease;
  }

  button:active {
    transform: scale(0.95);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    width: calc(720px * var(--zoom));
    height: calc(720px * var(--zoom));
    border: 2px solid #555;
  }

.tile {
  position: relative;
  border: 1px solid #d9bfb0;
  background: repeating-linear-gradient(
    45deg,
    #f5e2b8,
    #f5e2b8 5px,
    #f2d8a7 10px
  );
  background-blend-mode: multiply;
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.05);
  transition: filter 0.3s ease;
}
.tile:hover {
  filter: brightness(1.07);
  cursor: pointer;
}

  .tile-label {
    position: absolute;
    bottom: 4px;
    right: 6px;
    font-size: 10px;
    color: #888;
  }

  .pin {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

.dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fff, var(--pin-color));
  box-shadow: 0 0 6px rgba(0,0,0,0.4);
  transition: transform 0.2s ease;
}
.pin:hover .dot {
  transform: scale(1.3);
}

  .star {
    color: gold;
    font-size: 16px;
    text-shadow: 0 0 3px black;
    transition: transform 0.2s ease, text-shadow 0.2s ease;
  }

  .star:hover {
    transform: scale(1.3);
    text-shadow: 0 0 10px gold, 0 0 20px orange;
  }

  .pin-list {
    width: 260px;
  }

  .pin-card {
    background: #2a2a3d;
    border-radius: 0.5rem;
    padding: 0.7rem 1rem;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }

  .filter-item {
    display: flex;
    align-items: center;
    padding: 0.2rem 0;
  }

  .filter-item input {
    margin-right: 0.5rem;
  }

  /* 左下のパネル */
.task-panel {
  background: #1e1e2a;
  padding: 1rem;
  width: 260px;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  font-size: 0.85rem;
  margin-top: 2rem;
}

/* ピンが強調される点滅アニメーション */
@keyframes blink {
  0% { transform: scale(1); box-shadow: 0 0 6px rgba(255,255,255,0.6); }
  50% { transform: scale(1.2); box-shadow: 0 0 12px rgba(255,255,255,1); }
  100% { transform: scale(1); box-shadow: 0 0 6px rgba(255,255,255,0.6); }
}

.pin.blinking {
  animation: blink 1s infinite;
  z-index: 10;
}

/* タスク一覧 */
.task-item {
  background: #2a2a3d;
  padding: 0.5rem;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.task-item.done {
  opacity: 0.5;
  text-decoration: line-through;
}
.pin-card.done {
  opacity: 0.6;
  text-decoration: line-through;
}

.pin.linked {
  transform: scale(1.4);
  z-index: 20;
  box-shadow: 0 0 10px rgba(0, 200, 255, 0.8);
}

</style>

<div class="layout">
  <!-- 左：機能パネル -->
  <div class="form-card">
    <div class="accordion-section">
      <div class="accordion-title" on:click={() => toggleAccordion('pin')}> ピン追加・編集</div>
      {#if openSection === 'pin'}
        <div class="accordion-content" transition:slide>
          <label>カテゴリ:</label>
          <select bind:value={selectedCategory}>
            {#each categories as cat}
              <option value={cat.name}>{cat.name}</option>
            {/each}
          </select>

          <label>メモ:</label>
          <input type="text" bind:value={memo} placeholder="例：敵がいた" />

          {#if editingIndex === null}
            <p style="font-size: 0.8rem; color: gray;">※マップをクリックしてピン追加</p>
          {:else}
            <button on:click={saveEdit}>保存</button>
            <button on:click={cancelEdit}>キャンセル</button>
            <button on:click={() => deletePin(editingIndex)}>削除</button>
          {/if}
        </div>
      {/if}
    </div>

    <div class="accordion-section">
      <div class="accordion-title" on:click={() => toggleAccordion('category')}> カテゴリ管理</div>
      {#if openSection === 'category'}
        <div class="accordion-content" transition:slide>
          <input type="text" bind:value={newCategoryName} placeholder="カテゴリ名" />
          <input type="color" bind:value={newCategoryColor} />
          <button on:click={addCategory}>＋追加</button>
        </div>
      {/if}
    </div>

    <div class="accordion-section">
      <div class="accordion-title" on:click={() => toggleAccordion('filter')}> フィルター・並び替え</div>
      {#if openSection === 'filter'}
        <div class="accordion-content" transition:slide>
          <label>並び替え:</label>
          <select bind:value={sortMode}>
            <option value="created">追加順</option>
            <option value="tile">タイル順</option>
            <option value="color">色順</option>
          </select>

          <label>表示フィルター:</label>
          {#each categories as cat}
            <div class="filter-item">
              <input type="checkbox" bind:group={filterCategories} value={cat.name} />
              <label>{cat.name}</label>
            </div>
          {/each}

          <label> ズーム</label>
          <button on:click={() => zoom = Math.min(2, zoom + 0.1)}>＋</button>
          <button on:click={() => zoom = Math.max(0.5, zoom - 0.1)}>−</button>
        </div>
      {/if}
    </div>

    <div class="accordion-section">
      <div class="accordion-title" on:click={() => toggleAccordion('stats')}> 統計・管理</div>
      {#if openSection === 'stats'}
        <div class="accordion-content" transition:slide>
          <ul>
            {#each categories as cat}
              <li>{cat.name}：{pins.filter(p => p.category === cat.name).length} 件</li>
            {/each}
          </ul>
          <button on:click={() => {
            if (confirm('本当にすべてのピンを削除しますか？')) {
              pins = [];
            }
          }}>🗑 すべて削除</button>
        </div>
      {/if}
    </div>



<!-- タスク／メモ機能（左パネルの一番下） -->
<div class="accordion-section">
  <div class="accordion-title" on:click={() => toggleAccordion('tasks')}>
     タスク／メモ
  </div>
  {#if openSection === 'tasks'}
    <div class="accordion-content" transition:slide>
      <label>日時:</label>
      <input type="date" bind:value={taskDate} />
      <input type="time" bind:value={taskTime} />

      <label>内容:</label>
      <input type="text" bind:value={taskMessage} placeholder="例：F6を攻める" />

      <label>ピンを選択:</label>
<select bind:value={selectedPinIndex}>
  <option value={null}>未指定</option>
  {#each pins as p, idx}
    <option value={idx}>{p.tile} / {p.category}{p.memo ? ` - ${p.memo}` : ''}</option>
  {/each}
</select>

      <button on:click={addTask}>＋登録</button>

      <h4> 登録済み</h4>
      {#each tasks as t}
        <div class="task-item {t.done ? 'done' : ''}">
          <div><b>{t.datetime}</b></div>
          <div>{t.message}</div>
          {#if t.linkedPinIndex !== null}
            <div style="font-size: 0.75rem;">🔗 ピン: {pins[t.linkedPinIndex]?.tile}</div>
          {/if}
          <button on:click={() => toggleTaskDone(t.id)}>
            {t.done ? '未完了に戻す' : '完了'}
          </button>
          <button on:click={() => deleteTask(t.id)}>削除</button>
        </div>
      {/each}
    </div>
  {/if}
</div>

  </div>


  <!-- 中央：マップ -->
  <div class="grid" style="--zoom: {zoom};">
    {#each rows as row}
      {#each cols as col}
        <div class="tile" on:click={(e) => addPin(`${row}${col}`, e)}>
          <div class="tile-label">{row}{col}</div>
          {#each getSortedPins().filter(p => p.tile === `${row}${col}`) as pin (pin)}
            <div
              class="pin"
              style="left:{pin.x}%; top:{pin.y}%;"
              title={`${pin.important ? '★ ' : ''}${pin.category}${pin.memo ? `: ${pin.memo}` : ''}`}
              on:click|stopPropagation={() => startEdit(pins.indexOf(pin))}
              transition:fly={{ y: 10, duration: 300 }}
            >
              {#if pin.important}
                <span class="star">★</span>
              {:else}
                <div class="dot" style="background:{pin.color};"></div>
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    {/each}
  </div>

<!-- 登録済みタスク一覧：ピン一覧の左に配置 -->
<div class="pin-list">
  <h3> 登録済みタスク</h3>
  {#each tasks as t}
    <div class="pin-card {t.done ? 'done' : ''}" transition:fade>
      <b>{t.datetime}</b><br>
      {t.message}
      {#if t.linkedPinIndex !== null}
        <div style="font-size: 0.75rem;">🔗 ピン: {pins[t.linkedPinIndex]?.tile}</div>
      {/if}
      <div style="margin-top: 0.5rem;">
        <button on:click={() => toggleTaskDone(t.id)}>
          {t.done ? '未完了に戻す' : '完了'}
        </button>
        <button on:click={() => deleteTask(t.id)}>削除</button>
      </div>
    </div>
  {/each}
</div>

  <!-- 右：ピン一覧 -->
  <div class="pin-list">
    <h3> 登録済みピン</h3>
    {#each getSortedPins() as pin (pin)}
      <div class="pin-card" transition:fade>
        <b>{pin.tile}</b> {#if pin.important}<span style="color: gold;">★</span>{/if}
        / {pin.category}
        <span style="display:inline-block; width:10px; height:10px; background:{pin.color}; margin:0 5px; border-radius:50%;"></span>
        {#if pin.memo}<br>{pin.memo}{/if}
        <div style="font-size: 0.7rem; color: #aaa;"> {pin.createdAt}</div>
        <div style="margin-top: 0.5rem;">
          <button on:click={() => startEdit(pins.indexOf(pin))}>編集</button>
          <button on:click={() => deletePin(pins.indexOf(pin))}>削除</button>
          <button on:click={() => toggleImportant(pins.indexOf(pin))}>
            {pin.important ? '★解除' : '★重要'}
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

