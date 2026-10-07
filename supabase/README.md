# 临时收纳（/app/tmp）

页面使用已有的 Supabase 登录会话和 Nuxt UI。文件与 UTF-8 纯文本保存在私有 `tmp` bucket 的 `<uid>/` 目录下，单个文件最多 50 MiB。内容保留到用户手动删除，不会自动过期。

上线前，需要在目标 Supabase 项目应用 `migrations/20261007055611_tmp_storage.sql`，它会创建（或设为私有）`tmp` bucket，并配置读取、上传、更新和删除策略。额外的 restrictive 策略确保已有的宽松 Storage 策略不会开放其他用户的目录。此迁移不改变其他 bucket 的访问规则。

本仓库未保存远程数据库的完整迁移历史。请通过项目既有的迁移流程执行，或将该 SQL 文件放入 Supabase SQL Editor 执行；不要直接在未同步迁移历史的数据库上使用 `db push`。

存储对象名使用随机 UUID 与原文件名的 UTF-8 base64url 编码，避免重名覆盖并支持中文等文件名。页面显示和下载时还原原文件名；已有的普通对象名也可以显示。纯文本不会作为 HTML 或 Markdown 渲染。

应用迁移后，在本地测试数据库验证 RLS（测试数据与临时策略都会回滚）：

```sh
npx supabase db query --local --file supabase/tests/tmp_storage.sql
```

该测试覆盖两个用户的读取、上传、更新和删除权限，跨目录移动、bucket 根目录上传、未登录访问，以及已有宽松策略下的隔离和其他 bucket 的访问。
