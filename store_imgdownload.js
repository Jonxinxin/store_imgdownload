// ==UserScript==
// @name         商详图片下载助手 - 京东丨淘宝丨天猫
// @namespace    
// @version      0.0.1
// @description  可以直接下载视频的主图、视频和详情页
// @author       ykcory
// @license      MIT
// @match        *://item.jd.com/*
// @match        *://detail.tmall.com/*
// @match        *://item.taobao.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
  
    /**
     * 创建 a 标签
     */
    function createElement(tagName) {
        return document.createElement(tagName);
    }
  
    function createATag(innerText) {
        const aTag = createElement("a");
        aTag.href = "javascript:void(0)";
        aTag.innerText = innerText;
        return aTag;
    }
    
    /**
     * 简化 querySelector
     */
    function querySelector(selectors) {
        return document.querySelector(selectors);
    }
    
    function querySelectorAll(selectors) {
        return document.querySelectorAll(selectors);
    }

    /**
     * 下载图片函数
     */
    function downloadImage(url, filename) {
        // 确保URL是完整的并获取最高质量
        if (!url.startsWith('http')) {
            url = 'https:' + url;
        }
        
        // 处理不同平台的高清图片URL
        if (url.includes('jd.com')) {
            // 京东图片替换为最高清晰度
            url = url.replace(/s\d+x\d+_/, '')  // 移除尺寸限制
                     .replace(/n\d+/, 'n0')      // n0是最大图
                     .replace(/w\d+/, 'w1000')   // 设置最大宽度
                     .replace(/q\d+/, 'q100');   // 设置最高质量
        } else if (url.includes('taobao') || url.includes('tmall')) {
            // 淘宝/天猫图片替换为最高清晰度
            url = url.replace('_.webp', '')      // 移除webp格式
                     .replace(/\d+x\d+/, '1000x1000')  // 设置最大尺寸
                     .replace(/q\d+/, 'q100')    // 设置最高质量
                     .replace('thumbnail', 'original'); // 使用原图
        }

        // 创建一个隐藏的iframe来处理下载
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // 在iframe中创建一个img标签来加载图片
        const img = iframe.contentDocument.createElement('img');
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            // 创建canvas来处理图片
            const canvas = iframe.contentDocument.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            // 将图片画到canvas上
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // 从canvas获取图片数据并下载，使用最高质量
            canvas.toBlob((blob) => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename || 'image.jpg';
                link.click();
                
                // 清理资源
                setTimeout(() => {
                    URL.revokeObjectURL(link.href);
                    document.body.removeChild(iframe);
                }, 100);
            }, 'image/jpeg', 1.0);  // 质量设置为1.0，即100%最高质量
        };
        
        // 处理加载失败的情况
        img.onerror = function() {
            console.error('图片加载失败，尝试直接下载:', url);
            // 如果转换失败，直接在新窗口打开
            window.open(url, '_blank');
            document.body.removeChild(iframe);
        };
        
        // 开始加载图片
        img.src = url;
    }
  
    /**
     * 京东图片下载
     */
    function jdDownload() {
        const leftBtns = querySelector(".preview-wrap .left-btns");
        // 添加下载图片按钮
        const downTopImgBtn = createATag("下载图片");
        leftBtns.appendChild(downTopImgBtn);
        downTopImgBtn.addEventListener("click", () => {
            const imgList = querySelectorAll(".preview-wrap .spec-list li img");
            imgList.forEach((img, index) => {
                const imgUrl = img.src.replace("n5", "n12");
                setTimeout(() => {
                    downloadImage(imgUrl, `商品图片_${index + 1}.jpg`);
                }, index * 300);
            });
        });
        // 添加下载视频按钮
        const downVideoBtn = createATag("下载视频");
        leftBtns.appendChild(downVideoBtn);
        downVideoBtn.addEventListener("click", () => {
            // 播放视频
            const previewBtn = querySelector(".preview-wrap .preview-btn .video-icon");
            previewBtn.click();
            // 获取播放按钮
            setTimeout(() => {
                const video = querySelector(
                    ".preview-wrap .J-v-player #video-player_html5_api source"
                );
                if (video) {
                    downloadImage(video.src, '商品视频.mp4');
                }
            }, 500);
        });
        // 下载详情页
        const descDownload = () => {
            setTimeout(() => {
                const ssdModule = querySelector(".ssd-module-wrap");
                if (ssdModule) {
                    const downDetailBtn = createATag("下载详情页");
                    ssdModule.insertBefore(downDetailBtn, ssdModule.firstChild);
                    const alldiv = querySelectorAll(".ssd-module-wrap div");
                    const allBg = [];
                    alldiv.forEach((item) => {
                        const style = getComputedStyle(item);
                        const bg = style.backgroundImage;
                        if (bg) {
                            const regex = /url\("(.*?)"\)/;
                            const match = bg.match(regex);
                            if (match){
                                allBg.push(match[1]);
                            }
                        }
                    });
                    downDetailBtn.addEventListener("click", () => {
                        allBg.forEach((imgUrl, index) => {
                            setTimeout(() => {
                                downloadImage(imgUrl, `详情图片_${index + 1}.jpg`);
                            }, index * 300);
                        });
                    });
                } else {
                    descDownload();
                }
            }, 1000);
        };
        descDownload();
    }
  
    /**
     * 淘宝图片下载
     */
    function taobaoDownload() {
        window.setTimeout(() => {
            if (querySelector("[class^=mainPicWrap--]")) {
                topImgDownload();
                downloadSkuImg();
            } else {
                taobaoDownload();
            }
        }, 1000);
    }
  
    function topImgDownload() {
        let btnsWrap = querySelector("[class^=picGallery--]");
  
        const downVideoBtn = createATag("下载视频");
        downVideoBtn.style.position = "absolute";
        downVideoBtn.style.bottom = "-12px";
        downVideoBtn.style.right = "100px";
        btnsWrap.appendChild(downVideoBtn);
  
        const topImg = querySelectorAll("[class^=picGallery--] ul li")[0];
        downVideoBtn.addEventListener("click", () => {
            topImg.click();
            setTimeout(() => {
                const video = querySelector("[class^=mainPicVideo--] video");
                if (video) {
                    downloadImage(video.src, '商品视频.mp4');
                }
            }, 500);
        });
  
        const downTopBtn = createATag("下载图片");
        downTopBtn.style.position = "absolute";
        downTopBtn.style.bottom = "-12px";
        downTopBtn.style.right = "150px";
  
        btnsWrap.appendChild(downTopBtn);
        downTopBtn.addEventListener("click", () => {
            const imgList = querySelectorAll("[class^=picGallery--] ul li img");
            imgList.forEach((img, index) => {
                const baseSrc = img.src;
                let imgUrl = baseSrc.replace("img", "gw");
                imgUrl = imgUrl.replace("_.webp", "");
                setTimeout(() => {
                    downloadImage(imgUrl, `商品图片_${index + 1}.jpg`);
                }, index * 300);
            });
        });
    }
  
    function downloadSkuImg() {
        const skuContentList = querySelectorAll("[class^=SkuContent--] [class^=skuItem--]");
        skuContentList.forEach((skuContent) => {
            const imgList = skuContent.querySelectorAll("img");
            if(imgList.length){
                skuContent.style.position = "relative";
                const downSkuImgBtn = createATag("下载sku图片");
                downSkuImgBtn.style.position = "absolute";
                downSkuImgBtn.style.bottom = "-10px";
                downSkuImgBtn.style.left = "75px";
                skuContent.appendChild(downSkuImgBtn);
  
                downSkuImgBtn.addEventListener("click", () => {
                    imgList.forEach((img, index) => {
                        const baseSrc = img.src;
                        const imgUrl = baseSrc.replace("_.webp", "");
                        setTimeout(() => {
                            downloadImage(imgUrl, `SKU图片_${index + 1}.jpg`);
                        }, index * 300);
                    });
                });
            }
        });
    }
  
    const currentHref = window.location.href;
    const isJd = currentHref.includes("item.jd.com");
    const isTm = currentHref.includes("detail.tmall.com");
    const isTb = currentHref.includes("item.taobao.com");
    if (isJd) {
        jdDownload();
    }
    if (isTb || isTm) {
        taobaoDownload();
    }
  
})();