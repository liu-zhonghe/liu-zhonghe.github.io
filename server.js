const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// JSON文件路径配置（仅保留笔记数据）
const NOTES_FILE = path.join(__dirname, 'notes.json');

// 工具函数：读取JSON文件
function readJsonFile(filePath) {
    const rawData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(rawData);
}

// 工具函数：写入JSON文件
function writeJsonFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// 笔记接口（公共访问，无需认证）
app.get('/api/notes', async (req, res) => {
    try {
        const notesData = readJsonFile(NOTES_FILE);
        res.json(notesData.notes);
    } catch (error) {
        res.status(500).json({ message: '服务器错误：' + error.message });
    }
});

app.post('/api/notes', async (req, res) => {
    try {
        const { title, content } = req.body;

        // 新增：后端格式校验（示例：标题不允许特殊符号）
        const titleRegex = /^[\u4e00-\u9fa5a-zA-Z0-9\s.,!?]+$/;
        if (!titleRegex.test(title)) {
            return res.status(400).json({
                message: '标题格式错误：仅支持中文、字母、数字及常用标点（如.,!?）'
            });
        }
        const notesData = readJsonFile(NOTES_FILE);
        const newNote = {
            id: notesData.notes.length + 1,
            title,
            content,
            create_time: new Date().toISOString(),
            update_time: new Date().toISOString()
        };
        notesData.notes.push(newNote);
        writeJsonFile(NOTES_FILE, notesData);
        res.json({ message: '笔记创建成功', noteId: newNote.id });
    } catch (error) {
        res.status(500).json({ message: '服务器错误：' + error.message });
    }
});

app.put('/api/notes/:id', async (req, res) => {
    try {
        const noteId = parseInt(req.params.id);
        const { title, content } = req.body;
        const notesData = readJsonFile(NOTES_FILE);
        const noteIndex = notesData.notes.findIndex(n => n.id === noteId);
        if (noteIndex === -1) {
            return res.status(404).json({ message: '笔记不存在' });
        }
        notesData.notes[noteIndex] = {
            ...notesData.notes[noteIndex],
            title,
            content,
            update_time: new Date().toISOString()
        };
        writeJsonFile(NOTES_FILE, notesData);
        res.json({ message: '笔记更新成功' });
    } catch (error) {
        res.status(500).json({ message: '服务器错误：' + error.message });
    }
});

app.delete('/api/notes/:id', async (req, res) => {
    try {
        const noteId = parseInt(req.params.id);
        const notesData = readJsonFile(NOTES_FILE);
        const noteIndex = notesData.notes.findIndex(n => n.id === noteId);
        if (noteIndex === -1) {
            return res.status(404).json({ message: '笔记不存在' });
        }
        notesData.notes.splice(noteIndex, 1);
        writeJsonFile(NOTES_FILE, notesData);
        res.json({ message: '笔记删除成功' });
    } catch (error) {
        res.status(500).json({ message: '服务器错误：' + error.message });
    }
});

// 静态文件服务
app.use(express.static('.'));
app.listen(3000, () => {
    console.log('服务运行在 http://localhost:3000');
});