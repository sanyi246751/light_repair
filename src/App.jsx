import React, { useState, useEffect, useRef } from 'react';
import EXIF from 'exif-js';
import './index.css';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxdpaA2X-qwW4RNbMnIdHKCE3D92rlx6aztJnFIZ9CIlBWpK5ga8f2XedMLIpjLToIr/exec";

function App() {
    const [projectData, setProjectData] = useState([]);
    const [selectedItem, setSelectedItem] = useState("");
    const [rDate, setRDate] = useState("");
    const [groups, setGroups] = useState([{ id: 1, pre: null, post: null }]);
    const [groupIdCounter, setGroupIdCounter] = useState(1);
    const [noteSelect, setNoteSelect] = useState("");
    const [noteText, setNoteText] = useState("");

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadText, setUploadText] = useState("0.0%");
    const [uploadTitle, setUploadTitle] = useState("📤 正在處理資料");

    const smoothIntervalRef = useRef(null);

    useEffect(() => {
        setRDate(new Date().toISOString().split("T")[0]);
        fetch(SCRIPT_URL)
            .then(r => r.json())
            .then(d => {
                setProjectData(d);
            });
    }, []);

    const addGroup = () => {
        setGroupIdCounter(prev => prev + 1);
        setGroups(prev => [...prev, { id: groupIdCounter + 1, pre: null, post: null }]);
    };

    const removeGroup = (id) => {
        if (groups.length <= 1) return alert("至少要保留一組");
        if (window.confirm("確定刪除？")) {
            setGroups(prev => prev.filter(g => g.id !== id));
        }
    };

    const handleFileChange = (e, groupId, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;

            setGroups(prev => prev.map(g => {
                if (g.id === groupId) {
                    return { ...g, [type]: dataUrl };
                }
                return g;
            }));

            // 嘗試讀取 EXIF 日期
            if (type === 'post') {
                const img = new Image();
                img.src = dataUrl;
                img.onload = () => {
                    EXIF.getData(img, function () {
                        const exifDate = EXIF.getTag(this, "DateTimeOriginal");
                        if (exifDate) {
                            const parts = exifDate.split(" ")[0].split(":");
                            if (parts.length === 3) {
                                setRDate(`${parts[0]}-${parts[1]}-${parts[2]}`);
                            }
                        }
                    });
                };
            }
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = (groupId, type) => {
        setGroups(prev => prev.map(g => {
            if (g.id === groupId) {
                return { ...g, [type]: null };
            }
            return g;
        }));
    };

    const handlePick = (inputId) => {
        document.getElementById(inputId).click();
    };

    const handleCam = (inputId) => {
        const el = document.getElementById(inputId);
        el.setAttribute("capture", "camera");
        el.click();
    };

    const completeCount = groups.filter(g => g.pre && g.post).length;

    const startSmoothClimb = (startP, maxP, speed) => {
        let current = startP;
        clearInterval(smoothIntervalRef.current);
        smoothIntervalRef.current = setInterval(() => {
            if (current < maxP) {
                let step = (maxP - current) * 0.05;
                current += step < 0.01 ? 0.01 : step;
                setUploadProgress(current);
                setUploadText(current.toFixed(1) + "%");
            } else {
                clearInterval(smoothIntervalRef.current);
            }
        }, speed);
    };

    const compress = (b) => {
        return new Promise(res => {
            let i = new Image();
            i.src = b;
            i.onload = () => {
                let c = document.createElement("canvas"), w = i.width, h = i.height, m = 1024;
                if (w > h && w > m) { h *= m / w; w = m; }
                else if (h > m) { w *= m / h; h = m; }
                c.width = w; c.height = h;
                c.getContext("2d").drawImage(i, 0, 0, w, h);
                res(c.toDataURL("image/jpeg", 0.7));
            };
        });
    };

    const handleUpload = async () => {
        if (!selectedItem) return alert("請選擇維修項目");

        const firstIncomplete = groups.find(g => !g.pre || !g.post);
        if (firstIncomplete) {
            const el = document.getElementById(`g${firstIncomplete.id}`);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("shake");
                setTimeout(() => el.classList.remove("shake"), 500);
            }
            return alert("有照片未完成");
        }

        setIsUploading(true);
        setUploadTitle("📤 正在處理資料");
        setUploadProgress(0);
        setUploadText("0.0%");

        let photos = [];
        let totalImgs = groups.length * 2;
        let currentStep = 0;

        for (let i = 0; i < groups.length; i++) {
            let g = groups[i];
            let a = await compress(g.pre);
            currentStep++;
            let p1 = (currentStep / totalImgs) * 50;
            setUploadProgress(p1);
            setUploadText(p1.toFixed(1) + "%");

            let b = await compress(g.post);
            currentStep++;
            let p2 = (currentStep / totalImgs) * 50;
            setUploadProgress(p2);
            setUploadText(p2.toFixed(1) + "%");

            photos.push({ pre: a, post: b });
        }

        setUploadTitle("🚀 資料傳送中...");
        startSmoothClimb(50.1, 98.5, 150);

        let cur = projectData.find(d => d.row == selectedItem);

        try {
            const finalNote = noteSelect === "其他" ? noteText : noteSelect;
            const response = await fetch(SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({
                    row: selectedItem,
                    note: finalNote,
                    dateStr: rDate,
                    photos,
                    nameA: cur?.colA,
                    nameB: cur?.colB
                })
            });

            if (response.ok) {
                clearInterval(smoothIntervalRef.current);
                setUploadProgress(100.0);
                setUploadText("100.0%");
                setUploadTitle("✅ 儲存成功");
                setTimeout(() => {
                    alert("上傳成功");
                    window.location.reload();
                }, 800);
            } else {
                throw new Error("Server Error");
            }
        } catch (err) {
            clearInterval(smoothIntervalRef.current);
            alert("上傳失敗，請檢查網路後重試。");
            setIsUploading(false);
        }
    };

    return (
        <>
            <div className="nav-bar"><div className="nav-title">路燈維修回報系統</div></div>

            <div className={`container ${isUploading ? 'lock' : ''}`} id="page">
                <div className="card">
                    <label className="label">維修項目</label>
                    <select
                        className="input-field"
                        value={selectedItem}
                        onChange={(e) => setSelectedItem(e.target.value)}
                    >
                        {projectData.length === 0 ? (
                            <option value="">載入中...</option>
                        ) : (
                            <>
                                <option value="">-- 請選擇維修項目 --</option>
                                {projectData.map((x, i) => (
                                    <option key={i} value={x.row}>{x.text}</option>
                                ))}
                            </>
                        )}
                    </select>
                    <label className="label">維修日期</label>
                    <input
                        type="date"
                        className="input-field"
                        value={rDate}
                        onChange={(e) => setRDate(e.target.value)}
                    />
                </div>

                <div id="photoContainer">
                    {groups.map((group, index) => {
                        const isComplete = group.pre && group.post;
                        return (
                            <div
                                key={group.id}
                                id={`g${group.id}`}
                                className={`photo-card ${isComplete ? '' : 'incomplete'}`}
                            >
                                <div className="photo-header">
                                    <div>📸 第 {index + 1} 組維修照片</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className={`status-badge ${isComplete ? 'status-complete' : 'status-incomplete'}`}>
                                            {isComplete ? '已完成' : '未完成'}
                                        </span>
                                        <button className="delete-btn" onClick={() => removeGroup(group.id)} type="button">
                                            <svg viewBox="0 0 24 24">
                                                <path d="M3 6h18v2H3V6zm2 3h14l-1.5 12h-11L5 9zm5-5h4v2h-4V4z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="photo-body">
                                    <div className="comparison-grid">
                                        {/* 維修前 */}
                                        <div>
                                            <div className="comp-label">維修前照片</div>
                                            <div className="upload-box" onClick={() => !group.pre && handlePick(`f-pre-${group.id}`)}>
                                                {!group.pre ? (
                                                    <div className="upload-icon">照片上傳📷</div>
                                                ) : (
                                                    <>
                                                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removePhoto(group.id, 'pre'); }}>✕</button>
                                                        <img src={group.pre} alt="pre" />
                                                    </>
                                                )}
                                            </div>
                                            {!group.pre && (
                                                <button className="cam-btn" onClick={() => handleCam(`f-pre-${group.id}`)}>📸 拍照上傳</button>
                                            )}
                                            <input
                                                type="file"
                                                className="hidden"
                                                id={`f-pre-${group.id}`}
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, group.id, 'pre')}
                                            />
                                        </div>
                                        {/* 維修後 */}
                                        <div>
                                            <div className="comp-label">維修後照片</div>
                                            <div className="upload-box" onClick={() => !group.post && handlePick(`f-post-${group.id}`)}>
                                                {!group.post ? (
                                                    <div className="upload-icon">照片上傳📷</div>
                                                ) : (
                                                    <>
                                                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removePhoto(group.id, 'post'); }}>✕</button>
                                                        <img src={group.post} alt="post" />
                                                    </>
                                                )}
                                            </div>
                                            {!group.post && (
                                                <button className="cam-btn" onClick={() => handleCam(`f-post-${group.id}`)}>📸 拍照上傳</button>
                                            )}
                                            <input
                                                type="file"
                                                className="hidden"
                                                id={`f-post-${group.id}`}
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, group.id, 'post')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button className="btn-add" onClick={addGroup}>＋ 新增一組維修照片</button>
                <div className="complete-count" id="countText">
                    {completeCount > 0 ? `✅ 已完成 ${completeCount} 組維修照片` : '尚未完成任何組別'}
                </div>

                <div className="card">
                    <label className="label">維修說明 (備註)</label>
                    <select
                        className="input-field"
                        value={noteSelect}
                        onChange={(e) => setNoteSelect(e.target.value)}
                    >
                        <option value="">無</option>
                        <option value="外線故障，已通知台電處理">外線故障，已通知台電處理</option>
                        <option value="自備線故障">自備線故障</option>
                        <option value="其他">其他</option>
                    </select>
                    <textarea
                        className={`input-field ${noteSelect !== "其他" ? "hidden" : ""}`}
                        style={{ height: '80px' }}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="請輸入其他備註"
                    ></textarea>
                </div>

                <button className="btn-submit" onClick={handleUpload}>確認上傳存檔</button>
            </div>

            <div className={`upload-mask ${!isUploading ? 'hidden' : ''}`}>
                <div className="upload-box-ui">
                    <div className="upload-title">{uploadTitle}</div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <div className="progress-text">{uploadText}</div>
                </div>
            </div>
        </>
    );
}

export default App;
