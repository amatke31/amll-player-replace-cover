import { useEffect, type FC } from "react";
import { consoleLog } from "./consoleLog";
import { open } from "@tauri-apps/plugin-dialog";
import { useLiveQuery } from "dexie-react-hooks";
import { Playlist } from "./type";
import { readFile } from "@tauri-apps/plugin-fs";

const useReplaceCover = () => {
    const _enabled = true;

    const playlists: Playlist[] = useLiveQuery(
        () => extensionContext.playerDB.playlists.toArray(),
        [],
        []
    );

    function init() {
        consoleLog("INFO", "初始化替换封面功能");
        checkPlaylists();
    }

    function checkPlaylists() {
        playlists.forEach((playlist) => {
            if (!playlist.playlistCover) {
                consoleLog("INFO", `播放列表 ${playlist.name} 没有封面`);
            } else {
                consoleLog("INFO", `播放列表 ${playlist.name} 已有封面`);
            }
        });
    }

    function appendButton() {
        return;
        const btnGroup = document.querySelector(".rt-Flex.rt-r-gap-2");
        if (btnGroup) {
            const buttons = btnGroup.querySelectorAll("button");
            if (buttons.length >= 3) {
                if (!btnGroup.querySelector("button[data-replace-cover]")) {
                    const newBtn = document.createElement("button");
                    newBtn.className =
                        "rt-reset rt-BaseButton rt-r-size-2 rt-variant-soft rt-Button";
                    newBtn.textContent = "使用封面";
                    newBtn.setAttribute("data-replace-cover", "true");
                    newBtn.onclick = () => {
                        addCover();
                    };
                    btnGroup.appendChild(newBtn);
                }
            }
        }
    }

    async function addCover() {
        const results = await open({
            recursive: true,
        });
        if (!results) return;

        const coverExtensions = ["jpg", "jpeg", "png"];

        async function getCoverBlob(cover: string) {
            if (coverExtensions.some((ext) => cover.toLowerCase().endsWith(ext))) {
                try {
                    const fileContent = await readFile(cover);
                    const blob = new Blob([new Uint8Array(fileContent)], { type: "image/*" });
                    consoleLog("INFO", "成功将封面转换为 Blob 对象");

                    return blob;
                } catch (err) {
                    console.error("Error reading cover:", err);
                }
            } else {
                return consoleLog("WARN", `错误的封面格式：${cover}`);
            }
        }

        const coverBlob = await getCoverBlob(results);
        if (!coverBlob) {
            return consoleLog("WARN", "图片为空");
        }
        // await extensionContext.playerDB.songs.update(songId, { cover: coverBlob });
    }

    function apply() {
        let styleElement = document.getElementById("_replaceCover_style");
        if (!styleElement) {
            styleElement = document.createElement("style");
            styleElement.id = "_replaceCover_style";
            document.head.appendChild(styleElement);
        }

        if (!_enabled) {
            styleElement.innerHTML = "";
            return;
        }

        let css = "";

        styleElement.innerHTML = css;
        consoleLog("INFO", "已替换播放列表封面");
    }

    init();

    return {
        appendButton,
        apply,
    };
};

export const ExtensionContext: FC = () => {
    const replaceCover = useReplaceCover();

    useEffect(() => {
        const mainDiv = document.querySelector('div[class*="_main_"]');
        if (!mainDiv) return;

        const observer = new MutationObserver(() => {
            replaceCover.appendButton();
        });

        observer.observe(mainDiv, { childList: true });

        replaceCover.appendButton();

        console.log(extensionContext);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        consoleLog("INFO", "Extension context has been mounted");
        replaceCover.apply();
    }, []);

    return null;
};
