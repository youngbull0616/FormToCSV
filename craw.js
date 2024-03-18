// ==UserScript==
// @name         自动翻页表格爬虫导出CSV
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  自动翻页并导出页面上的表格数据为CSV格式
// @homepage     https://github.com/youngbull0616/HTMLformToCSV
// @match        *
// @author       YB
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let currentPage = 1; // 当前页数
    let pagesVisited = 0; // 记录已遍历的页数
    let tablesData = ''; // 记录表格数据
    const exportFrequency = 3; // 每隔多少页导出一次数据，可以自定义

    // 创建浮动窗口
    function createFloatingWindow() {
        const floatingWindow = document.createElement('div');
        floatingWindow.id = 'floatingWindow';
        floatingWindow.innerHTML = `
            <div id="resizeHandle"></div>
            <div id="exportButtonDiv">
                <button id="exportButton">导出表格</button>
            </div>
            <div id="logDiv">
                <p id="logText">日志信息:</p>
            </div>
        `;
        document.body.appendChild(floatingWindow);

        // 设置初始位置
        floatingWindow.style.top = '100px';
        floatingWindow.style.left = '100px';

        // 绑定拖动事件
        dragElement(floatingWindow);

        // 绑定导出按钮点击事件
        const exportButton = document.getElementById('exportButton');
        exportButton.addEventListener('click', exportTables);

        // 绑定调整大小事件
        const resizeHandle = document.getElementById('resizeHandle');
        resizeHandle.addEventListener('mousedown', initResize, false);
    }

    // 拖动浮动窗口
    function dragElement(elmnt) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (document.getElementById(elmnt.id + 'header')) {
            // 如果提供了头部，将头部作为移动句柄：
            document.getElementById(elmnt.id + 'header').onmousedown = dragMouseDown;
        } else {
            // 否则，移动窗口的任意位置
            elmnt.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // 获取鼠标点击位置
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // 拖动时触发
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // 计算新位置
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // 设置元素位置
            elmnt.style.top = (elmnt.offsetTop - pos2) + 'px';
            elmnt.style.left = (elmnt.offsetLeft - pos1) + 'px';
        }

        function closeDragElement() {
            // 停止拖动时触发
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // 初始化调整大小
    function initResize(e) {
        window.addEventListener('mousemove', Resize, false);
        window.addEventListener('mouseup', stopResize, false);
    }

    // 调整大小
    function Resize(e) {
        const floatingWindow = document.getElementById('floatingWindow');
        floatingWindow.style.width = (e.clientX - floatingWindow.offsetLeft) + 'px';
        floatingWindow.style.height = (e.clientY - floatingWindow.offsetTop) + 'px';
    }

    // 停止调整大小
    function stopResize() {
        window.removeEventListener('mousemove', Resize, false);
        window.removeEventListener('mouseup', stopResize, false);
    }

    // 模拟翻页操作
    function nextPage() {
        const nextButton = document.querySelector('.btn-next');
        if (nextButton) {
            nextButton.click();
            console.log('正在加载第 ' + (currentPage + 1) + ' 页...');
            currentPage++;
            pagesVisited++;
        } else {
            console.log('已经到达最后一页。');
        }
    }

    // 导出表格数据为CSV格式
function exportTables() {
    const tables = document.querySelectorAll('table');
    if (tables.length === 0) {
        alert('页面中没有找到表格！');
        return;
    }

    tables.forEach(table => {
        let firstRowSkipped = false;
        table.querySelectorAll('tr').forEach(row => {
            // 跳过第一行，即表头
            if (!firstRowSkipped) {
                firstRowSkipped = true;
                return;
            }
            const rowData = [];
            row.querySelectorAll('th, td').forEach(cell => {
                rowData.push(`"${cell.textContent.trim().replace(/"/g, '""')}"`);
            });
            const rowString = rowData.join(',');
            // 检查是否为非空行
            if (rowString.trim() !== '') {
                tablesData += rowString + '\n';
            }
        });
    });

    // 每遍历指定页数导出一次
    if (pagesVisited % exportFrequency === 0 && pagesVisited !== 0) {
        // 创建并下载CSV文件
        const blob = new Blob([tablesData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `exported_tables_${currentPage}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // 清空表格数据
        tablesData = '';
    }

    // 更新日志信息
    const logText = document.getElementById('logText');
    logText.innerText = `日志信息: 已导出至第 ${currentPage} 页`;

    // 继续翻页并导出
    nextPage();
    if (currentPage <= 500) { // 假设只爬取前500页数据
        setTimeout(exportTables, 2000); // 延迟2秒继续导出下一页数据
    }
}

    // 主程序入口
    window.addEventListener('load', () => {
        createFloatingWindow();
    });
})();
