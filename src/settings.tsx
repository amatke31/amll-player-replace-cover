import { atom, useAtom } from "jotai";
import { useEffect, type FC, PropsWithChildren } from "react";
import chalk from "chalk";
import { Button, Card, Flex, Select, Text, TextField, TextProps } from "@radix-ui/themes";
import { ImageIcon } from "@radix-ui/react-icons";
import { open } from "@tauri-apps/plugin-dialog";
import { exists, readFile } from "@tauri-apps/plugin-fs";
import { toast } from "react-toastify";
import { db, Playlist, Song } from "./dexie";
import { Albums } from "./album";
import { useLiveQuery } from "dexie-react-hooks";

const WARN_TAG = chalk.bgHex("#de2a18").hex("#FFFFFF")(" WARN ");
const INFO_TAG = chalk.bgHex("#2376b7").hex("#FFFFFF")(" INFO ");
const LOG_TAG = chalk.bgHex("#1ba784").hex("#FFFFFF")(" LOG ");
const NAME_TAG = chalk.bgHex("#737c7b").hex("#FFFFFF")(" ReplaceCover ");

function getChalk(bg: string, fg: string, part: string) {
    return chalk.bgHex(bg).hex(fg)(` ${part} `);
}

export function consoleLog(type: string, part: string, info: string) {
    const PART_TAG = getChalk("#fa7e23", "#FFFFFF", part);
    if (type === "INFO") {
        console.log(NAME_TAG + INFO_TAG + PART_TAG, info);
    } else if (type === "WARN") {
        console.log(NAME_TAG + WARN_TAG + PART_TAG, info);
    } else if (type === "LOG") {
        console.log(NAME_TAG + LOG_TAG + PART_TAG, info);
    } else {
        console.log(NAME_TAG + NAME_TAG + PART_TAG, info);
    }
}

const coverAtom = atom("");
const albumAtom = atom("");

export const SettingPage: FC = () => {
    const playlists: Playlist[] = useLiveQuery(() => db.playlists.toArray(), [], []);
    const songs: Song[] = useLiveQuery(() => db.songs.toArray(), [], []);
    const albums: Albums = {};

    try {
        for (const song of songs) {
            if (!Object.hasOwn(albums, song.songAlbum)) {
                albums[song.songAlbum] = [];
            }
            albums[song.songAlbum].push(song.id);
        }
    } catch (e) {
        toast.warning(<>读取专辑列表时错误</>);
        consoleLog("WARN", "path", "读取专辑列表时错误");
    }

    const [cover, setCover] = useAtom(coverAtom);
    const [album, setAlbum] = useAtom(albumAtom);

    async function selectCover() {
        const results = await open({
            recursive: true,
        });
        if (!results) return;

        setCover(results);
    }

    async function replaceCover() {
        const coverExtensions = ["jpg", "jpeg", "png"];
        if (!cover) return;
        try {
            await exists(cover);
        } catch (e) {
            toast.warning(
                <>
                    错误的图片路径
                    <br />
                    {cover}
                </>
            );
            return consoleLog("WARN", "path", `错误的路径：${cover}`);
        }

        async function getCoverBlob(cover: string) {
            if (coverExtensions.some((ext) => cover.endsWith(ext))) {
                try {
                    const fileContent = await readFile(cover);

                    const blob = new Blob([new Uint8Array(fileContent)], { type: "image/*" });

                    consoleLog("INFO", "blob", "成功将封面转换为 Blob 对象");

                    return blob;
                } catch (err) {
                    toast.warning(
                        <>
                            读取封面时出错
                            <br />
                            {err}
                        </>,
                        { position: "bottom-left" }
                    );
                    console.error("Error reading cover:", err);
                }
            } else {
                toast.warning(
                    <>
                        错误的图片格式
                        <br />
                        {cover}
                    </>
                );
                return consoleLog("WARN", "ext", `错误的封面格式：${cover}`);
            }
        }

        const coverBlob = await getCoverBlob(cover);
        if (!coverBlob) {
            toast.warning(
                <>
                    图片文件为空
                    <br />
                    {cover}
                </>
            );
            return consoleLog("WARN", "image", "图片为空");
        }

        async function replaceSongsCover(album: string, coverBlob: Blob) {
            const mod = album.startsWith("#"); // true:Playlist false:Album
            if (!albums[album] && !mod) {
                toast.warning(`专辑 "${album}" 不存在或没有歌曲`);
                return;
            }

            let current = 0;
            let success = 0;
            let errored = 0;
            let failedList: string[] = [];

            const needReplaceSongs: string[] = mod
                ? playlists.find((playlist) => playlist.id == Number(album.slice(1))).songIds
                : albums[album];

            for (const songId of needReplaceSongs) {
                try {
                    await db.songs.update(songId, { cover: coverBlob });
                    success++;
                } catch (error) {
                    errored++;
                    failedList.push(songId);
                    consoleLog("WARN", "db", `无法更新歌曲 ${songId} 的封面: ${error}`);
                } finally {
                    current++;
                }
            }

            if (errored > 0 && success > 0) {
                consoleLog("WARN", "file", "\n" + failedList.join("\n"));
                toast.warn(
                    <>
                        已替换 {success} 首歌曲的封面，剩余 {errored} 首歌曲替换失败
                    </>
                );
            } else if (success === 0) {
                toast.error(`${errored} 首歌曲的封面替换失败`);
            } else {
                toast.success(`已成功替换 ${success} 首歌曲的封面`);
            }
            consoleLog("INFO", "", "封面全部替换完成");
        }

        await replaceSongsCover(album, coverBlob);
    }

    useEffect(() => {
        console.log("SettingPage Loaded");
    }, []);

    const SubTitle: FC<PropsWithChildren<TextProps>> = ({ children, ...props }) => {
        return (
            <Text weight="bold" size="4" my="4" as="div" {...props}>
                {children}
            </Text>
        );
    };

    return (
        <>
            <SubTitle>批量替换封面</SubTitle>
            <Card mt="2">
                <Flex direction="row" align="center" gap="4" my="2">
                    <Text as="div">选择封面</Text>
                    <Flex direction="column" flexGrow="1">
                        <TextField.Root
                            value={cover}
                            onChange={(e) => setCover(e.currentTarget.value)}
                        />
                    </Flex>
                    <Button
                        radius="large"
                        color="indigo"
                        variant="soft"
                        onClick={() => selectCover()}
                    >
                        <ImageIcon />
                    </Button>
                </Flex>
                <Flex direction="row" align="end" gap="4" my="2">
                    <Flex direction="column" flexGrow="1">
                        <Text as="div">应用到</Text>
                    </Flex>
                    <Select.Root defaultValue={album} onValueChange={(v) => setAlbum(v)}>
                        <Select.Trigger />
                        <Select.Content>
                            <Select.Group>
                                <Select.Label>播放列表</Select.Label>
                                {playlists.map((playlist) => (
                                    <Select.Item value={"#" + playlist.id}>
                                        {playlist.name}
                                    </Select.Item>
                                ))}
                            </Select.Group>
                            <Select.Separator />
                            <Select.Group>
                                <Select.Label>专辑</Select.Label>
                                {Object.keys(albums).map((album) => (
                                    <Select.Item value={album}>{album}</Select.Item>
                                ))}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                    <Button color="cyan" variant="soft" onClick={() => replaceCover()}>
                        开始更改
                    </Button>
                </Flex>
            </Card>
        </>
    );
};
