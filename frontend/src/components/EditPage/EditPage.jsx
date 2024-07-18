import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import DeleteModal from '../DeleteModal/DeleteModal';
import instance from '../../api/AxiosInstance';
import { toastMessage } from '../../utils/Toast';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import EditorComponent from '../EditorComponent/EditorComponent';

export default function EditPage () {
  const [searchParams] = useSearchParams();
  const docId = searchParams.get('id');
  const dir = searchParams.get('dir');
  const pageId = searchParams.get('pageId');
  const pageGroupId = searchParams.get('pageGroupId');
  const { refreshData } = useContext(AuthContext);

  const navigate = useNavigate();
  const [pageData, setPageData] = useState({});
  const [isDelete, setIsDelete] = useState(false);

  const updateContent = (newContent, name) => {
    setPageData((prevPageData) => ({
      ...prevPageData,
      [name]: newContent
    }));
  };

  const [content, setContent] = useState({});

  useEffect(() => {
    const fetchdata = async () => {
      try {
        const response = await instance.post('docs/page', {
          id: Number(pageId)
        });
        if (response?.status === 200) {
          setPageData(response?.data);
        }
      } catch (err) {
        if (!err.response) {
          toastMessage(err?.message, 'error');
          navigate('/server-down');
        }
        toastMessage(err?.response?.data?.message, 'error');
      }
    };

    fetchdata();
  }, [pageId, navigate]);

  const handleEdit = async () => {
    try {
      const response = await instance.post('/docs/page/edit', {
        title: pageData?.title,
        slug: pageData?.slug,
        content: JSON.stringify(content),
        id: Number(pageId)
      });

      if (response?.status === 200) {
        toastMessage(response?.data.message, 'success');
        if (dir === 'true') {
          refreshData();
          navigate(`/dashboard/documentation?id=${docId}`);
        } else {
          refreshData();
          navigate(
            `/dashboard/documentation/pagegroup?id=${docId}&pageGroupId=${pageGroupId}`
          );
        }
      }
    } catch (err) {
      if (!err.response) {
        toastMessage(err?.message, 'error');
        navigate('/server-down');
      }
      toastMessage(err?.response?.data?.message, 'error');
    }
  };

  const handleCloseDelete = () => {
    setIsDelete(false);
  };

  const handleDelete = async () => {
    try {
      const response = await instance.post('docs/page/delete', {
        id: Number(pageId)
      });
      if (response?.status === 200) {
        toastMessage(response?.data?.message, 'success');
        if (dir === 'true') {
          refreshData();
          navigate(`/dashboard/documentation?id=${docId}`);
        } else {
          refreshData();
          navigate(
            `/dashboard/documentation/pagegroup?id=${docId}&pageGroupId=${pageGroupId}`
          );
        }
      }
    } catch (err) {
      if (!err.response) {
        toastMessage(err?.message, 'error');
        navigate('/server-down');
      }
      toastMessage(err?.response?.data?.message, 'error');
    }
  };
  const handleSave = useCallback((content) => {
    setContent(content);
  }, []);
  return (
    <AnimatePresence>
      {isDelete && (
        <DeleteModal
          cancelModal={handleCloseDelete}
          deleteDoc={handleDelete}
          id={pageData.id}
          title='Are you sure?'
          message={`You.re permanently deleting "${pageData.title}"`}
        />
      )}
      {/* <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1 }}
        className='flex mb-5'
        aria-label='Breadcrumb'
      >
        <ol className='inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse'>
        {breadcrumb.map((crumb,index)=>(
            <li>
            <Link to={crumb.path} className='flex items-center ' >
            <Icon icon='mingcute:right-fill'  className='text-gray-500' />
              <p
                className={`ms-1 text-sm font-medium  md:ms-2 dark:text-gray-400 dark:hover:text-white`}
              >
                {crumb.title}
              </p>
            </Link>
          </li>
          ))}
        </ol>
      </motion.nav> */}
      <Breadcrumb />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1 }}
        id='defaultModal'
        tabIndex='-1'
        aria-hidden='true'
        className='flex  items-center w-full md:inset-0 h-modal md:h-full'
      >
        <div className='w-full h-full md:h-auto'>
          <div className='relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5'>
            <div className='flex justify-start items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600'>
              <h3 className='text-2xl  font-semibold text-gray-900 dark:text-white'>
                Edit Page
              </h3>
            </div>

            <div className='grid gap-4 mb-4 '>
              <div>
                <label
                  htmlFor='title'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Title
                </label>
                <input
                  type='text'
                  required
                  value={pageData.title}
                  onChange={(e) => updateContent(e.target.value, e.target.name)}
                  name='title'
                  id='title'
                  className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                  placeholder='Page title'
                />
              </div>

              <div>
                <label
                  htmlFor='slug'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Slug
                </label>
                <input
                  type='text'
                  required
                  value={pageData.slug}
                  onChange={(e) => updateContent(e.target.value, e.target.name)}
                  name='slug'
                  id='slug'
                  className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                  placeholder='Page slug'
                />
              </div>

              <div className=''>
                <label
                  htmlFor='content'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Content
                </label>
                <div className='border border-gray-400 rounded-lg dark:text-white '>
                  <EditorComponent pageId={pageId} onSave={handleSave} />
                </div>
              </div>
            </div>

            <div className='flex justify-center gap-5'>
              <button
                onClick={handleEdit}
                type='submit'
                className='text-white inline-flex gap-1 items-center bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center '
              >
                <Icon
                  icon='ri:edit-fill'
                  className='w-5 h-5 text-white dark:text-white'
                />
                Edit
              </button>

              <button
                whilehover={{ scale: 1.1 }}
                onClick={() => setIsDelete(!isDelete)}
                className='flex cursor-pointer items-center bg-red-600 text-white px-2  focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-smpy-2.5 text-center'
              >
                Delete
                <Icon icon='material-symbols:delete' className='w-6 h-6' />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}