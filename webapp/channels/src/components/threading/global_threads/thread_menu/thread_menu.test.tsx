// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ComponentProps} from 'react';
import {set} from 'lodash';
import {shallow} from 'enzyme';

import {Preferences} from 'mattermost-redux/constants';
import {setUnreadPost} from 'mattermost-redux/actions/posts';
jest.mock('mattermost-redux/actions/posts');

import {setThreadFollow, updateThreadRead, markLastPostInThreadAsUnread} from 'mattermost-redux/actions/threads';
jest.mock('mattermost-redux/actions/threads');

import {manuallyMarkThreadAsUnread} from 'actions/views/threads';
jest.mock('actions/views/threads');

import ThreadMenu from '../thread_menu';
import Menu from 'components/widgets/menu/menu';

import {
    flagPost as savePost,
    unflagPost as unsavePost,
} from 'actions/post_actions';
jest.mock('actions/post_actions');

import {copyToClipboard} from 'utils/utils';
import {fakeDate} from 'tests/helpers/date';
import {GlobalState} from 'types/store';
jest.mock('utils/utils');

import {ThreadRouting} from 'components/threading/hooks';
const mockRouting = {
    params: {
        team: 'team-name-1',
    },
    currentUserId: 'uid',
    currentTeamId: 'tid',
    goToInChannel: jest.fn(),
};

const mockDispatch = jest.fn();
let mockState: GlobalState;

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux') as typeof import('react-redux'),
    useSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState),
    useDispatch: () => mockDispatch,
}));

describe('components/threading/common/thread_menu', () => {
    let props: ComponentProps<typeof ThreadMenu>;

    beforeEach(() => {
        props = {
            threadId: '1y8hpek81byspd4enyk9mp1ncw',
            unreadTimestamp: 1610486901110,
            hasUnreads: false,
            isFollowing: false,
            children: (
                <button>{'test'}</button>
            ),
            routing: mockRouting as unknown as ThreadRouting,
        };

        mockState = {
            entities: {
                general: {
                    config: {
                        CollapsedThreads: 'default_off',
                    },
                },
                preferences: {
                    myPreferences: {
                        [`${Preferences.CATEGORY_DISPLAY_SETTINGS}--${Preferences.COLLAPSED_REPLY_THREADS}`]: {
                            value: 'on',
                        },
                    },
                },
            },
        } as unknown as GlobalState;
    });

    test('should match snapshot', () => {
        const wrapper = shallow(
            <ThreadMenu
                {...props}
            />,
        );
        expect(wrapper).toMatchSnapshot();
    });

    test('should match snapshot after opening', () => {
        const wrapper = shallow(
            <ThreadMenu
                {...props}
            />,
        );
        wrapper.find('button').simulate('click');
        expect(wrapper).toMatchSnapshot();
    });

    test('should allow following', () => {
        const wrapper = shallow(
            <ThreadMenu
                {...props}
                isFollowing={false}
            />,
        );
        wrapper.find('button').simulate('click');
        wrapper.find(Menu.ItemAction).find({text: 'Follow thread'}).simulate('click');
        expect(setThreadFollow).toHaveBeenCalledWith('uid', 'tid', '1y8hpek81byspd4enyk9mp1ncw', true);
        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    test('should allow unfollowing', () => {
        const wrapper = shallow(
            <ThreadMenu
                {...props}
                isFollowing={true}
            />,
        );
        wrapper.find('button').simulate('click');
        wrapper.find(Menu.ItemAction).find({text: 'Unfollow thread'}).simulate('click');
        expect(setThreadFollow).toHaveBeenCalledWith('uid', 'tid', '1y8hpek81byspd4enyk9mp1ncw', false);
        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    test('should allow opening in channel', () => {
        const wrapper = shallow(
            <ThreadMenu
                {...props}
            />,
        );
        wrapper.find('button').simulate('click');
        wrapper.find(Menu.ItemAction).find({text: 'Open in channel'}).simulate('click');
        expect(mockRouting.goToInChannel).toHaveBeenCalledWith('1y8hpek81byspd4enyk9mp1ncw');
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    test('should allow marking as read', () => {
        const resetFakeDate = fakeDate(new Date(1612582579566));
        const wrapper = shallow(
            <ThreadMenu
                {...props}
                hasUnreads={true}
            />,
        );
        wrapper.find('button').simulate('click');
        wrapper.find(Menu.ItemAction).find({text: 'Mark as read'}).simulate('click');
        expect(markLastPostInThreadAsUnread).not.toHaveBeenCalled();
        expect(updateThreadRead).toHaveBeenCalledWith('uid', 'tid', '1y8hpek81byspd4enyk9mp1ncw', 1612582579566);
        expect(manuallyMarkThreadAsUnread).toHaveBeenCalledWith('1y8hpek81byspd4enyk9mp1ncw', 1612582579566);
        expect(mockDispatch).toHaveBeenCalledTimes(2);
        resetFakeDate();
    });

    test('should allow marking as unread', () => {
        const wrapper = shallow(
            <ThreadMenu
                {...props}
                hasUnreads={false}
            />,
        );
        wrapper.find('button').simulate('click');
        wrapper.find(Menu.ItemAction).find({text: 'Mark as unread'}).simulate('click');
        expect(updateThreadRead).not.toHaveBeenCalled();
        expect(markLastPostInThreadAsUnread).toHaveBeenCalledWith('uid', 'tid', '1y8hpek81byspd4enyk9mp1ncw');
        expect(manuallyMarkThreadAsUnread).toHaveBeenCalledWith('1y8hpek81byspd4enyk9mp1ncw', 1610486901110);
        expect(mockDispatch).toHaveBeenCalledTimes(2);
    });

    test('should allow saving', () => {
        const wrapper = shallow(
            <ThreadMenu
                {...props}
            />,
        );
        wrapper.find('button').simulate('click');
        wrapper.find(Menu.ItemAction).find({text: 'Save'}).simulate('click');
        expect(savePost).toHaveBeenCalledWith('1y8hpek81byspd4enyk9mp1ncw');
        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
    test('should allow unsaving', () => {
        set(mockState, 'entities.preferences.myPreferences', {
            'flagged_post--1y8hpek81byspd4enyk9mp1ncw': {
                user_id: 'uid',
                category: 'flagged_post',
                name: '1y8hpek81byspd4enyk9mp1ncw',
                value: 'true',
            },
        });

        const wrapper = shallow(
            <ThreadMenu
                {...props}
            />,
        );
        wrapper.find('button').simulate('click');
        wrapper.find(Menu.ItemAction).find({text: 'Unsave'}).simulate('click');
        expect(unsavePost).toHaveBeenCalledWith('1y8hpek81byspd4enyk9mp1ncw');
        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    test('should allow link copying', () => {
        const wrapper = shallow(
            <ThreadMenu
                {...props}
            />,
        );
        wrapper.find('button').simulate('click');
        wrapper.find(Menu.ItemAction).find({text: 'Copy link'}).simulate('click');
        expect(copyToClipboard).toHaveBeenCalledWith('http://localhost:8065/team-name-1/pl/1y8hpek81byspd4enyk9mp1ncw');
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    describe('CRT - off', () => {
        beforeEach(() => {
            set(mockState, 'entities.preferences.myPreferences', {
                [`${Preferences.CATEGORY_DISPLAY_SETTINGS}--${Preferences.COLLAPSED_REPLY_THREADS}`]: {
                    value: 'off',
                },
            });
        });

        test('should not allow following', () => {
            const wrapper = shallow(
                <ThreadMenu
                    {...props}
                    isFollowing={false}
                />,
            );
            wrapper.find('button').simulate('click');
            expect(wrapper.find(Menu.ItemAction).find({text: 'Follow thread'}).exists()).toBe(false);
            expect(mockDispatch).not.toHaveBeenCalled();
        });

        test('should not allow unfollowing', () => {
            const wrapper = shallow(
                <ThreadMenu
                    {...props}
                    isFollowing={true}
                />,
            );
            wrapper.find('button').simulate('click');
            expect(wrapper.find(Menu.ItemAction).find({text: 'Unfollow thread'}).exists()).toBe(false);
            expect(mockDispatch).not.toHaveBeenCalled();
        });

        test('should allow marking as unread', () => {
            const wrapper = shallow(
                <ThreadMenu
                    {...props}
                    hasUnreads={false}
                />,
            );

            wrapper.find('button').simulate('click');
            wrapper.find(Menu.ItemAction).find({text: 'Mark as unread'}).simulate('click');

            expect(updateThreadRead).not.toHaveBeenCalled();
            expect(markLastPostInThreadAsUnread).not.toHaveBeenCalled();
            expect(manuallyMarkThreadAsUnread).not.toHaveBeenCalled();
            expect(setUnreadPost).toHaveBeenCalledWith('uid', '1y8hpek81byspd4enyk9mp1ncw');
            expect(mockDispatch).toHaveBeenCalledTimes(1);
        });
    });
});
