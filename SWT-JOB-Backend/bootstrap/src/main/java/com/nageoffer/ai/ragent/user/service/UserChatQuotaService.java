package com.nageoffer.ai.ragent.user.service;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import com.nageoffer.ai.ragent.user.dao.entity.UserDO;
import com.nageoffer.ai.ragent.user.dao.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserChatQuotaService {

    private static final String DEV_BYPASS_LOGIN_ID = "dev-admin";

    private final UserMapper userMapper;

    public Integer getRemaining(String userId) {
        if (StrUtil.isBlank(userId) || DEV_BYPASS_LOGIN_ID.equals(userId)) {
            return null;
        }
        UserDO user = userMapper.selectById(userId);
        if (user == null || "admin".equalsIgnoreCase(user.getRole())) {
            return null;
        }
        return user.getFreeChatRemaining();
    }

    /** 发起一次 AI 问答前调用；null 剩余额度表示不限次（老用户） */
    public void consumeOneChatOrThrow(String userId) {
        if (StrUtil.isBlank(userId) || DEV_BYPASS_LOGIN_ID.equals(userId)) {
            return;
        }
        UserDO user = userMapper.selectById(userId);
        if (user == null || "admin".equalsIgnoreCase(user.getRole())) {
            return;
        }
        Integer remaining = user.getFreeChatRemaining();
        if (remaining == null) {
            return;
        }
        if (remaining <= 0) {
            throw new ClientException("免费 AI 问答次数已用完，请前往个人主页钱包购买问答次数");
        }
        int updated = userMapper.update(
                null,
                Wrappers.lambdaUpdate(UserDO.class)
                        .set(UserDO::getFreeChatRemaining, remaining - 1)
                        .eq(UserDO::getId, userId)
                        .eq(UserDO::getFreeChatRemaining, remaining));
        if (updated == 0) {
            throw new ClientException("免费 AI 问答次数已用完，请前往个人主页钱包购买问答次数");
        }
    }

    public void addCredits(String userId, int count) {
        if (StrUtil.isBlank(userId) || count <= 0) {
            throw new ClientException("无效的问答次数");
        }
        if (DEV_BYPASS_LOGIN_ID.equals(userId)) {
            return;
        }
        UserDO user = userMapper.selectById(userId);
        if (user == null) {
            throw new ClientException("用户不存在");
        }
        if ("admin".equalsIgnoreCase(user.getRole())) {
            return;
        }
        Integer remaining = user.getFreeChatRemaining();
        int next = (remaining == null ? 0 : remaining) + count;
        userMapper.update(
                null,
                Wrappers.lambdaUpdate(UserDO.class)
                        .set(UserDO::getFreeChatRemaining, next)
                        .eq(UserDO::getId, userId));
    }
}
